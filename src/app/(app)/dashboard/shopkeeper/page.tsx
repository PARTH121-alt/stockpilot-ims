export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import { DollarSign, ShoppingCart, RotateCcw, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { SalesChart } from "@/components/charts/sales-chart";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";

export default async function ShopkeeperDashboard() {
  const user = await requireUser();
  const orgId = user.orgId;
  const branchId = user.branchIds[0];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todaySales, todayTransactions, returnCount, lowStock, recentSales, pendingTransfers] = await Promise.all([
    prisma.sale.aggregate({
      where: { orgId, branchId, invoiceDate: { gte: today } },
      _sum: { totalAmount: true },
    }),
    prisma.sale.count({ where: { orgId, branchId, invoiceDate: { gte: today } } }),
    prisma.refund.count({ where: { orgId, sale: { branchId }, createdAt: { gte: today } } }),
    prisma.inventoryBalance.findMany({
      where: { orgId, branchId, quantity: { lte: 10 } },
      take: 5,
      include: { product: { select: { name: true, sku: true } } },
      orderBy: { quantity: "asc" },
    }),
    prisma.sale.findMany({
      where: { orgId, branchId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } }, user: { select: { name: true } } },
    }),
    prisma.stockTransfer.count({ where: { orgId, OR: [{ fromBranchId: branchId }, { toBranchId: branchId }], status: { in: ["PENDING", "IN_TRANSIT"] } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Shopkeeper Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Branch operations and sales overview</p>
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
            <CardTitle className="text-sm font-medium text-gray-500">Transactions</CardTitle>
            <ShoppingCart className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayTransactions}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Returns</CardTitle>
            <RotateCcw className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{returnCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Transfers</CardTitle>
            <Package className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTransfers}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Branch Sales Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart orgId={orgId} />
          </CardContent>
        </Card>
        <LowStockAlerts orgId={orgId} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                  <p className="text-xs text-gray-500">{sale.customer?.name ?? "Walk-in"} • {sale.user.name}</p>
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
