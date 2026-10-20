export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { Package, Edit, ArrowLeft, MapPin, Calendar, Hash } from "lucide-react";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const { id } = await params;

  const product = await prisma.product.findFirst({
    where: { id, orgId },
    include: {
      category: { select: { name: true } },
      stockBalances: {
        include: {
          branch: { select: { name: true } },
          warehouse: { select: { name: true } },
          batch: { select: { batchNumber: true, expiryDate: true } },
        },
      },
      stockBatches: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!product) notFound();

  const totalStock = product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
  const totalReserved = product.stockBalances.reduce((sum, b) => sum + b.reserved, 0);
  const availableStock = totalStock - totalReserved;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{product.sku}</p>
        </div>
        <Badge variant={availableStock === 0 ? "destructive" : availableStock <= 10 ? "warning" : "success"}>
          {availableStock === 0 ? "Out of Stock" : availableStock <= 10 ? "Low Stock" : "In Stock"}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Category</p>
                <p className="text-sm font-medium">{product.category?.name ?? "Uncategorized"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Brand</p>
                <p className="text-sm font-medium">{product.brand ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Unit</p>
                <p className="text-sm font-medium">{product.unit}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Barcode</p>
                <p className="text-sm font-medium">{product.barcode ?? "—"}</p>
              </div>
            </div>
            {product.description && (
              <div>
                <p className="text-xs text-gray-500">Description</p>
                <p className="text-sm">{product.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-4 dark:border-gray-700">
              <div>
                <p className="text-xs text-gray-500">Purchase Cost</p>
                <p className="text-lg font-bold">{formatCurrency(Number(product.purchaseCost))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Selling Price</p>
                <p className="text-lg font-bold">{formatCurrency(Number(product.sellingPrice))}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Tax Rate</p>
                <p className="text-sm font-medium">{Number(product.taxRate)}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Margin</p>
                <p className="text-sm font-medium text-emerald-600">
                  {formatCurrency(Number(product.sellingPrice) - Number(product.purchaseCost))}
                  ({Number(product.sellingPrice) > 0 ? ((Number(product.sellingPrice) - Number(product.purchaseCost)) / Number(product.sellingPrice) * 100).toFixed(1) : "0"}%)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Total Stock</span>
                <span className="text-sm font-bold">{formatNumber(totalStock)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Reserved</span>
                <span className="text-sm font-medium text-amber-600">{formatNumber(totalReserved)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Available</span>
                <span className="text-sm font-bold text-emerald-600">{formatNumber(availableStock)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 dark:border-gray-700">
                <span className="text-sm text-gray-500">Reorder Level</span>
                <span className="text-sm font-medium">{formatNumber(product.reorderLevel)}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Stock by Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {product.stockBalances.map((balance) => (
                  <div key={balance.id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium">{balance.branch.name}</p>
                      <p className="text-xs text-gray-500">{balance.warehouse.name}</p>
                    </div>
                    <span className="font-bold">{formatNumber(balance.quantity)}</span>
                  </div>
                ))}
                {product.stockBalances.length === 0 && (
                  <p className="text-sm text-gray-500">No stock records</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {product.stockBatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Batch History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Batch #</th>
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Mfg Date</th>
                    <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Expiry Date</th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Quantity</th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Remaining</th>
                    <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Unit Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {product.stockBatches.map((batch) => (
                    <tr key={batch.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3 text-sm font-medium">{batch.batchNumber}</td>
                      <td className="py-3 text-sm text-gray-500">{batch.mfgDate ? formatDate(batch.mfgDate) : "—"}</td>
                      <td className="py-3 text-sm text-gray-500">{batch.expiryDate ? formatDate(batch.expiryDate) : "—"}</td>
                      <td className="py-3 text-right text-sm">{formatNumber(batch.quantity)}</td>
                      <td className="py-3 text-right text-sm font-medium">{formatNumber(batch.remainingQty)}</td>
                      <td className="py-3 text-right text-sm">{formatCurrency(Number(batch.unitCost))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
