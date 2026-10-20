import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const orgId = user.orgId;

    const items = await prisma.inventoryBalance.findMany({
      where: { orgId, quantity: { lte: 10 } },
      take: 5,
      include: { product: { select: { name: true, sku: true, reorderLevel: true } } },
      orderBy: { quantity: "asc" },
    });

    const products = items.map((b) => ({
      id: b.id,
      name: b.product.name,
      sku: b.product.sku,
      quantity: b.quantity,
      reorderLevel: b.product.reorderLevel,
    }));

    return NextResponse.json(products);
  } catch (error) {
    console.error("Low stock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
