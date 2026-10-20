export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, ShoppingCart, Users, ArrowRight } from "lucide-react";
import { SalesChart } from "@/components/charts/sales-chart";
import { TopProducts } from "@/components/charts/top-products";
import { BranchComparison } from "@/components/charts/branch-comparison";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { LowStockAlerts } from "@/components/dashboard/low-stock-alerts";
import { PendingApprovals } from "@/components/dashboard/pending-approvals";
import Link from "next/link";

export default async function OwnerDashboard() {
  const user = await requireUser();
  const orgId = user.orgId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  const [
    todaySales,
    monthSales,
    totalProducts,
    lowStockCount,
    outOfStockCount,
    pendingApprovals,
    recentSales,
    recentActivity,
    expiringBatches,
    stockValue,
    topProducts,
    branchStats,
  ] = await Promise.all([
    prisma.sale.aggregate({
      where: { orgId, invoiceDate: { gte: today } },
      _sum: { totalAmount: true },
      _count: { id: true },
    }),
    prisma.sale.aggregate({
      where: { orgId, invoiceDate: { gte: monthStart } },
      _sum: { totalAmount: true, taxTotal: true },
      _count: { id: true },
    }),
    prisma.product.count({ where: { orgId, isActive: true } }),
    prisma.product.count({ where: { orgId, isActive: true, stockBalances: { some: { quantity: { gt: 0, lte: 10 } } } } }),
    prisma.product.count({ where: { orgId, isActive: true, stockBalances: { some: { quantity: 0 } } } }),
    prisma.approvalRequest.count({ where: { orgId, status: "PENDING" } }),
    prisma.sale.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } }, branch: { select: { name: true } }, customer: { select: { name: true } } },
    }),
    prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { user: { select: { name: true } } },
    }),
    prisma.stockBatch.findMany({
      where: { orgId, isActive: true, expiryDate: { not: null, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } },
      take: 5,
      include: { product: { select: { name: true, sku: true } } },
    }),
    prisma.inventoryBalance.aggregate({
      where: { orgId },
      _sum: { quantity: true },
    }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { orgId } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 5,
    }),
    prisma.branch.findMany({
      where: { orgId },
      include: {
        sales: { where: { invoiceDate: { gte: monthStart } }, select: { totalAmount: true } },
        stockBalances: { select: { quantity: true } },
      },
    }),
  ]);

  const todayRevenue = Number(todaySales._sum.totalAmount ?? 0);
  const monthRevenue = Number(monthSales._sum.totalAmount ?? 0);
  const todayTransactions = todaySales._count.id;
  const monthTransactions = monthSales._count.id;

  const topProductsData = await Promise.all(
    topProducts.map(async (tp) => {
      const product = await prisma.product.findUnique({ where: { id: tp.productId }, select: { name: true, sku: true } });
      return { name: product?.name ?? "Unknown", quantity: tp._sum.quantity ?? 0, revenue: Number(tp._sum.totalPrice ?? 0) };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Owner Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Consolidated business overview for your organization</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Today&apos;s Sales</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(todayRevenue)}</div>
            <p className="text-xs text-gray-500">{todayTransactions} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Monthly Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(monthRevenue)}</div>
            <p className="text-xs text-gray-500">{monthTransactions} transactions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Products</CardTitle>
            <Package className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalProducts)}</div>
            <p className="text-xs text-gray-500">{formatNumber(stockValue._sum.quantity ?? 0)} units in stock</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
            <p className="text-xs text-gray-500">Require your review</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart orgId={orgId} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Products</CardTitle>
          </CardHeader>
          <CardContent>
            <TopProducts data={topProductsData} />
          </CardContent>
        </Card>
      </div>

      {/* Branch Comparison & Alerts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Branch Comparison (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <BranchComparison branches={branchStats.map((b) => ({ ...b, sales: b.sales.map((s) => ({ totalAmount: Number(s.totalAmount) })) }))} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Expiring Batches (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            {expiringBatches.length === 0 ? (
              <p className="text-sm text-gray-500">No batches expiring soon</p>
            ) : (
              <div className="space-y-3">
                {expiringBatches.map((batch) => (
                  <div key={batch.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{batch.product.name}</p>
                      <p className="text-xs text-gray-500">Batch: {batch.batchNumber}</p>
                    </div>
                    <Badge variant="warning">{formatDateTime(batch.expiryDate)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity & Alerts Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{sale.branch.name} • {sale.user.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(sale.totalAmount))}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(sale.invoiceDate)}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/sales" className="mt-3 inline-flex items-center text-sm text-indigo-600 hover:underline">
              View all sales <ArrowRight className="ml-1 h-3 w-3" />
            </Link>
          </CardContent>
        </Card>
        <div className="space-y-4">
          <LowStockAlerts orgId={orgId} />
          <PendingApprovals orgId={orgId} />
        </div>
      </div>
    </div>
  );
}
