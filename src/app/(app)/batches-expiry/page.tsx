export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/utils";
import { AlertTriangle, Search } from "lucide-react";

export default async function BatchesExpiryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";

  const where = {
    orgId,
    isActive: true,
    ...(search && {
      OR: [
        { product: { name: { contains: search, mode: "insensitive" as const } } },
        { batchNumber: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [batches, total] = await Promise.all([
    prisma.stockBatch.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
      },
      orderBy: { expiryDate: "asc" },
      take: 100,
    }),
    prisma.stockBatch.count({ where }),
  ]);

  const now = new Date();
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Batches & Expiry</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} active batches</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Batch Tracking</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search batches..."
                className="flex h-9 w-64 rounded-md border border-gray-300 bg-white px-3 pl-9 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800"
                defaultValue={search}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Batch #</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Mfg Date</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Expiry Date</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Remaining</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((batch) => {
                  const isExpiringSoon = batch.expiryDate && batch.expiryDate <= thirtyDays;
                  const isExpired = batch.expiryDate && batch.expiryDate < now;
                  return (
                    <tr key={batch.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3">
                        <p className="text-sm font-medium">{batch.product.name}</p>
                        <p className="text-xs text-gray-500">{batch.product.sku}</p>
                      </td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{batch.batchNumber}</td>
                      <td className="py-3 text-sm text-gray-500">{batch.mfgDate ? formatDate(batch.mfgDate) : "—"}</td>
                      <td className="py-3 text-sm text-gray-500">{batch.expiryDate ? formatDate(batch.expiryDate) : "—"}</td>
                      <td className="py-3 text-right text-sm font-medium">{formatNumber(batch.remainingQty)}</td>
                      <td className="py-3 text-right">
                        {isExpired ? (
                          <Badge variant="destructive">Expired</Badge>
                        ) : isExpiringSoon ? (
                          <Badge variant="warning">
                            <AlertTriangle className="h-3 w-3" /> Expiring Soon
                          </Badge>
                        ) : (
                          <Badge variant="success">Good</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {batches.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No batches found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
