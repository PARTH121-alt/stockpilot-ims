export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ShoppingCart, DollarSign, Receipt, Clock } from "lucide-react";
import Link from "next/link";

export default async function StaffDashboard() {
  const user = await requireUser();
  const orgId = user.orgId;
  const branchId = user.branchIds[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySales, todayTransactions, mySales, recentSales, openShift] = await Promise.all([
    prisma.sale.aggregate({
      where: { orgId, branchId, invoiceDate: { gte: today } },
      _sum: { totalAmount: true },
    }),
    prisma.sale.count({ where: { orgId, branchId, invoiceDate: { gte: today } } }),
    prisma.sale.count({ where: { orgId, userId: user.id, invoiceDate: { gte: today } } }),
    prisma.sale.findMany({
      where: { orgId, userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
    prisma.shift.findFirst({
      where: { orgId, userId: user.id, status: "OPEN" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Point of sale and personal activity</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today&apos;s Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(Number(todaySales._sum.totalAmount ?? 0))}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">My Transactions</CardTitle>
            <Receipt className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mySales}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Branch Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Shift Status</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <Badge variant={openShift ? "success" : "secondary"}>{openShift ? "Open" : "Closed"}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Link href="/pos">
              <Badge variant="default" className="px-4 py-2 text-sm cursor-pointer">Open POS</Badge>
            </Link>
            <Link href="/sales">
              <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer">Sales History</Badge>
            </Link>
            <Link href="/customers">
              <Badge variant="outline" className="px-4 py-2 text-sm cursor-pointer">Customers</Badge>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>My Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{sale.customer?.name ?? "Walk-in"}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{formatCurrency(Number(sale.totalAmount))}</p>
                  <p className="text-xs text-gray-500">{formatDateTime(sale.invoiceDate)}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
