import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { generateIdempotencyKey } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("sales:create")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { orgId, branchId, userId, customerId, items, paymentMethod, total, subtotal, discountTotal, taxTotal } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items in sale" }, { status: 400 });
    }

    // Generate invoice number
    const date = new Date();
    const invoicePrefix = "INV";
    const invoiceNumber = `${invoicePrefix}${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    // Use idempotency key to prevent duplicate submissions
    const idempotencyKey = generateIdempotencyKey();

    // Create sale with items and update inventory in a transaction
    const sale = await prisma.$transaction(async (tx) => {
      // Verify stock availability for all items
      for (const item of items) {
        const balance = await tx.inventoryBalance.findFirst({
          where: {
            orgId,
            branchId,
            productId: item.productId,
          },
        });

        if (!balance || balance.quantity < item.quantity) {
          throw new Error(`Insufficient stock for product ${item.productId}`);
        }
      }

      // Create the sale
      const newSale = await tx.sale.create({
        data: {
          orgId,
          branchId,
          userId,
          customerId,
          invoiceNumber,
          idempotencyKey,
          subtotal,
          discountTotal,
          taxTotal,
          totalAmount: total,
          amountPaid: total,
          status: "COMPLETED",
          items: {
            create: items.map((item: { productId: string; quantity: number; unitPrice: number; discount: number; taxRate: number }) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              taxRate: item.taxRate,
              totalPrice: item.unitPrice * item.quantity - item.discount,
            })),
          },
        },
        include: { items: true },
      });

      // Update inventory balances and create stock movements
      for (const item of items) {
        const balance = await tx.inventoryBalance.findFirst({
          where: {
            orgId,
            branchId,
            productId: item.productId,
          },
        });

        if (balance) {
          await tx.inventoryBalance.update({
            where: { id: balance.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        await tx.stockMovement.create({
          data: {
            orgId,
            productId: item.productId,
            branchId,
            warehouseId: balance?.warehouseId ?? "",
            type: "ISSUE",
            quantity: -item.quantity,
            beforeQty: balance?.quantity ?? 0,
            afterQty: (balance?.quantity ?? 0) - item.quantity,
            referenceType: "SALE",
            referenceId: newSale.id,
            userId,
          },
        });
      }

      // Create payment record
      await tx.payment.create({
        data: {
          orgId,
          saleId: newSale.id,
          amount: total,
          method: paymentMethod,
          status: "COMPLETED",
          isSimulated: true,
          userId,
        },
      });

      // Create invoice
      await tx.invoice.create({
        data: {
          orgId,
          saleId: newSale.id,
          invoiceNumber,
        },
      });

      return newSale;
    });

    await prisma.auditLog.create({
      data: {
        orgId,
        branchId,
        userId,
        action: "CREATED_SALE",
        entityType: "Sale",
        entityId: sale.id,
        details: { invoiceNumber, total, itemCount: items.length },
      },
    });

    return NextResponse.json(sale, { status: 201 });
  } catch (error) {
    console.error("Sale creation error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
