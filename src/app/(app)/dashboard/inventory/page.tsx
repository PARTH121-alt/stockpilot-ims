export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDateTime } from "@/lib/utils";
import { Package, Boxes, AlertTriangle, ClipboardList, ArrowLeftRight, TrendingDown } from "lucide-react";

export default async function InventoryDashboard() {
  const user = await requireUser();
  const orgId = user.orgId;

  const [totalSKUs, stockValue, lowStock, outOfStock, expiringBatches, pendingCounts, pendingReceipts, recentMovements] = await Promise.all([
    prisma.product.count({ where: { orgId, isActive: true } }),
    prisma.inventoryBalance.aggregate({ where: { orgId }, _sum: { quantity: true } }),
    prisma.inventoryBalance.findMany({ where: { orgId, quantity: { gt: 0, lte: 10 } }, take: 5, include: { product: { select: { name: true, sku: true } } }, orderBy: { quantity: "asc" } }),
    prisma.inventoryBalance.findMany({ where: { orgId, quantity: 0 }, take: 5, include: { product: { select: { name: true, sku: true } } } }),
    prisma.stockBatch.findMany({ where: { orgId, isActive: true, expiryDate: { not: null, lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }, take: 5, include: { product: { select: { name: true } } } }),
    prisma.stockCount.count({ where: { orgId, status: "IN_PROGRESS" } }),
    prisma.goodsReceipt.count({ where: { orgId, status: "DRAFT" } }),
    prisma.stockMovement.findMany({ where: { orgId }, orderBy: { createdAt: "desc" }, take: 10, include: { product: { select: { name: true } }, user: { select: { name: true } }, branch: { select: { name: true } } } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Stock levels, movements, and alerts</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(totalSKUs)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Stock on Hand</CardTitle>
            <Boxes className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stockValue._sum.quantity ?? 0)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Counts</CardTitle>
            <ClipboardList className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCounts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Receipts</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingReceipts}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" /> Low Stock Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lowStock.length === 0 ? (
              <p className="text-sm text-gray-500">All items well stocked</p>
            ) : (
              <div className="space-y-2">
                {lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{item.product.sku}</p>
                    </div>
                    <Badge variant="warning">{item.quantity} left</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" /> Out of Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            {outOfStock.length === 0 ? (
              <p className="text-sm text-gray-500">No out-of-stock items</p>
            ) : (
              <div className="space-y-2">
                {outOfStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500">{item.product.sku}</p>
                    </div>
                    <Badge variant="destructive">Out of stock</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Stock Movements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentMovements.map((mv) => (
              <div key={mv.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium">{mv.product.name}</p>
                  <p className="text-xs text-gray-500">{mv.branch.name} • {mv.user.name}</p>
                </div>
                <div className="text-right">
                  <Badge variant={mv.type === "RECEIPT" || mv.type === "TRANSFER_IN" ? "success" : mv.type === "ISSUE" || mv.type === "TRANSFER_OUT" ? "destructive" : "secondary"}>
                    {mv.type.replace(/_/g, " ")}
                  </Badge>
                  <p className="text-xs text-gray-500">{mv.quantity > 0 ? "+" : ""}{mv.quantity} units</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
