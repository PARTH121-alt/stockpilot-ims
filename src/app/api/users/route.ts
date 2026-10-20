import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("users:manage")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, roleId, branchIds } = body;

    if (!name || !email || !password || !roleId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        orgId: user.orgId,
        name,
        email,
        passwordHash,
        roleId,
        isDemo: false,
        branchAccess: {
          create: branchIds.map((branchId: string) => ({ branchId })),
        },
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "CREATED_USER",
        entityType: "User",
        entityId: newUser.id,
        details: { name, email },
      },
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("User creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
