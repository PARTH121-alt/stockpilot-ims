import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("customers:manage")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, phone, address, gstin } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        orgId: user.orgId,
        name,
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
        entityType: "Customer",
        entityId: customer.id,
        details: { name },
      },
    });

    return NextResponse.json(customer, { status: 201 });
  } catch (error) {
    console.error("Customer creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
