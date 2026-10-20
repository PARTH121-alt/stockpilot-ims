export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Search, Package, AlertTriangle, TrendingDown, Boxes } from "lucide-react";
import { FilterBar } from "@/components/filters/filter-bar";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; branch?: string; status?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const branchId = params.branch ?? "";
  const status = params.status ?? "";

  const where = {
    orgId,
    ...(branchId && { branchId }),
    ...(search && {
      product: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
    ...(status === "low" && { quantity: { gt: 0, lte: 10 } }),
    ...(status === "out" && { quantity: 0 }),
    ...(status === "healthy" && { quantity: { gt: 10 } }),
  };

  const [balances, branches] = await Promise.all([
    prisma.inventoryBalance.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true, sellingPrice: true, reorderLevel: true } },
        branch: { select: { name: true } },
        warehouse: { select: { name: true } },
        batch: { select: { batchNumber: true, expiryDate: true } },
      },
      orderBy: { quantity: "asc" },
      take: 100,
    }),
    prisma.branch.findMany({ where: { orgId }, select: { id: true, name: true } }),
  ]);

  const totalValue = balances.reduce((sum, b) => sum + (b.quantity * Number(b.product.sellingPrice)), 0);
  const lowStockCount = balances.filter((b) => b.quantity > 0 && b.quantity <= 10).length;
  const outOfStockCount = balances.filter((b) => b.quantity === 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inventory</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Stock levels across all locations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Value</CardTitle>
            <Boxes className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Low Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Out of Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{outOfStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total SKUs</CardTitle>
            <Package className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{balances.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Stock Levels</CardTitle>
            <FilterBar
              searchPlaceholder="Search products..."
              filters={[
                {
                  param: "branch",
                  placeholder: "All Branches",
                  options: branches.map((b) => ({ value: b.id, label: b.name })),
                },
                {
                  param: "status",
                  placeholder: "All Status",
                  options: [
                    { value: "healthy", label: "Healthy" },
                    { value: "low", label: "Low Stock" },
                    { value: "out", label: "Out of Stock" },
                  ],
                },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Warehouse</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Batch</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Value</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance) => (
                  <tr key={balance.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <p className="text-sm font-medium">{balance.product.name}</p>
                      <p className="text-xs text-gray-500">{balance.product.sku}</p>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{balance.branch.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{balance.warehouse.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{balance.batch?.batchNumber ?? "—"}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatNumber(balance.quantity)}</td>
                    <td className="py-3 text-right text-sm">{formatCurrency(balance.quantity * Number(balance.product.sellingPrice))}</td>
                    <td className="py-3 text-right">
                      <Badge variant={balance.quantity === 0 ? "destructive" : balance.quantity <= 10 ? "warning" : "success"}>
                        {balance.quantity === 0 ? "Out" : balance.quantity <= 10 ? "Low" : "OK"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {balances.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No inventory records found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
