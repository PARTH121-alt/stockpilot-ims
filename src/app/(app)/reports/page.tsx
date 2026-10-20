export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { BarChart3, Download, TrendingUp, Package, DollarSign, Users } from "lucide-react";
import { SalesChart } from "@/components/charts/sales-chart";

export default async function ReportsPage() {
  const user = await requireUser();
  const orgId = user.orgId;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [revenue, cogs, topProducts, lowStockCount, customerCount, supplierCount] = await Promise.all([
    prisma.sale.aggregate({ where: { orgId, invoiceDate: { gte: monthStart } }, _sum: { totalAmount: true } }),
    prisma.saleItem.aggregate({ where: { sale: { orgId, invoiceDate: { gte: monthStart } } }, _sum: { totalPrice: true } }),
    prisma.saleItem.groupBy({
      by: ["productId"],
      where: { sale: { orgId } },
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: "desc" } },
      take: 10,
    }),
    prisma.inventoryBalance.count({ where: { orgId, quantity: { lte: 10 } } }),
    prisma.customer.count({ where: { orgId } }),
    prisma.supplier.count({ where: { orgId } }),
  ]);

  const totalRevenue = Number(revenue._sum.totalAmount ?? 0);
  const totalCOGS = Number(cogs._sum.totalPrice ?? 0);
  const grossProfit = totalRevenue - totalCOGS;
  const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  const topProductsData = await Promise.all(
    topProducts.map(async (tp) => {
      const product = await prisma.product.findUnique({ where: { id: tp.productId }, select: { name: true } });
      return { name: product?.name ?? "Unknown", quantity: tp._sum.quantity ?? 0, revenue: tp._sum.totalPrice ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Reports</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Business analytics and insights</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenue (Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
            <p className="text-xs text-gray-500">{grossMargin.toFixed(1)}% margin</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Low Stock Items</CardTitle>
            <Package className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Customers</CardTitle>
            <Users className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customerCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SalesChart orgId={orgId} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top Products by Quantity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProductsData.map((product, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600 dark:bg-indigo-900">
                      {i + 1}
                    </span>
                    <span className="text-sm font-medium">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatNumber(product.quantity)} sold</p>
                    <p className="text-xs text-gray-500">{formatCurrency(Number(product.revenue))}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
