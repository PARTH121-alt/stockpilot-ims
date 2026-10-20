import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";

export async function GET() {
  try {
    const user = await requireUser();
    const orgId = user.orgId;

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: { orgId, invoiceDate: { gte: thirtyDaysAgo } },
      select: { invoiceDate: true, totalAmount: true },
    });

    const grouped = sales.reduce((acc, sale) => {
      const date = sale.invoiceDate.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + Number(sale.totalAmount);
      return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(grouped)
      .map(([date, revenue]) => ({ date, revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(chartData);
  } catch (error) {
    console.error("Sales chart error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
