import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("products:manage")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, sku, barcode, description, unit, brand, purchaseCost, sellingPrice, taxRate, reorderLevel, reorderQty, categoryId, hasExpiry, hasBatch, hasSerial } = body;

    if (!name || !sku) {
      return NextResponse.json({ error: "Name and SKU are required" }, { status: 400 });
    }

    const existing = await prisma.product.findFirst({
      where: { orgId: user.orgId, sku },
    });

    if (existing) {
      return NextResponse.json({ error: "SKU already exists" }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        orgId: user.orgId,
        name,
        sku,
        barcode,
        description,
        unit: unit || "pcs",
        brand,
        purchaseCost: purchaseCost || 0,
        sellingPrice: sellingPrice || 0,
        taxRate: taxRate || 0,
        reorderLevel: reorderLevel || 0,
        reorderQty: reorderQty || 0,
        categoryId,
        hasExpiry: hasExpiry || false,
        hasBatch: hasBatch || false,
        hasSerial: hasSerial || false,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "CREATED",
        entityType: "Product",
        entityId: product.id,
        details: { name, sku },
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Product creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("products:manage")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "Product ID required" }, { status: 400 });
    }

    const product = await prisma.product.update({
      where: { id },
      data,
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "UPDATED",
        entityType: "Product",
        entityId: product.id,
        details: { name: product.name, sku: product.sku },
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Product update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
