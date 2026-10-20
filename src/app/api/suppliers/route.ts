import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("suppliers:manage")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, contactName, email, phone, address, gstin } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        orgId: user.orgId,
        name,
        contactName,
        email,
        phone,
        address,
        gstin,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "CREATED",
        entityType: "Supplier",
        entityId: supplier.id,
        details: { name },
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("Supplier creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
