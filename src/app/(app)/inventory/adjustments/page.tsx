export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { Tag, Search } from "lucide-react";

export default async function InventoryAdjustmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const status = params.status ?? "";

  const where: any = {
    orgId,
    ...(search && {
      product: { name: { contains: search, mode: "insensitive" as const } },
    }),
    ...(status && { status }),
  };

  const [adjustments, total] = await Promise.all([
    prisma.stockAdjustment.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        branch: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.stockAdjustment.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Adjustments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} adjustments</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Adjustment Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search adjustments..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {adjustments.map((adj) => (
                  <tr key={adj.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <p className="text-sm font-medium">{adj.product.name}</p>
                      <p className="text-xs text-gray-500">{adj.product.sku}</p>
                    </td>
                    <td className="py-3">
                      <Badge variant={adj.type === "INCREASE" ? "success" : "destructive"}>
                        {adj.type}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{adj.branch.name}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatNumber(adj.quantity)}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{adj.reason}</td>
                    <td className="py-3 text-right">
                      <Badge variant={
                        adj.status === "APPROVED" ? "success" :
                        adj.status === "REJECTED" ? "destructive" : "warning"
                      }>
                        {adj.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(adj.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {adjustments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No adjustments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
