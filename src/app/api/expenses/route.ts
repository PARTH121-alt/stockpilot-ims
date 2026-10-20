import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    if (!user.permissions.includes("finance:manage")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const { category, amount, description, expenseDate } = body;

    if (!category || !amount) {
      return NextResponse.json({ error: "Category and amount are required" }, { status: 400 });
    }

    const expense = await prisma.expense.create({
      data: {
        orgId: user.orgId,
        branchId: user.branchIds[0],
        category,
        amount,
        description,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        userId: user.id,
      },
    });

    await prisma.auditLog.create({
      data: {
        orgId: user.orgId,
        userId: user.id,
        action: "CREATED_EXPENSE",
        entityType: "Expense",
        entityId: expense.id,
        details: { category, amount },
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error("Expense creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
