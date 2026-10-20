import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("purchase:manage")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { supplierId, branchId, expectedDate, notes, items } = body;

    if (!supplierId || !branchId || !items || items.length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const date = new Date();
    const orderNumber = `PO${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}${String(date.getDate()).padStart(2, "0")}${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

    const totalAmount = items.reduce((sum: number, item: { quantity: number; unitPrice: number }) => sum + item.quantity * item.unitPrice, 0);

    const order = await prisma.purchaseOrder.create({
      data: {
        orgId: user.orgId,
        branchId,
        supplierId,
        orderNumber,
        expectedDate: expectedDate ? new Date(expectedDate) : null,
        notes,
        totalAmount,
        userId: user.id,
        status: "DRAFT",
        items: {
          create: items.map((item: { productId: string; quantity: number; unitPrice: number }) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        branchId,
        userId: user.id,
        action: "CREATED_PO",
        entityType: "PurchaseOrder",
        entityId: order.id,
        details: { orderNumber, totalAmount },
      },
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error("PO creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
