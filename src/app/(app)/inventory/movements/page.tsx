export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { ArrowLeftRight, Search } from "lucide-react";

export default async function InventoryMovementsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const type = params.type ?? "";

  const where: any = {
    orgId,
    ...(search && {
      product: {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { sku: { contains: search, mode: "insensitive" as const } },
        ],
      },
    }),
    ...(type && { type }),
  };

  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      include: {
        product: { select: { name: true, sku: true } },
        branch: { select: { name: true } },
        user: { select: { name: true } },
        batch: { select: { batchNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.stockMovement.count({ where }),
  ]);

  const getVariant = (type: string) => {
    switch (type) {
      case "RECEIPT": return "success";
      case "TRANSFER_IN": return "info";
      case "RETURN": return "default";
      case "ISSUE":
      case "TRANSFER_OUT": return "destructive";
      case "ADJUSTMENT":
      case "COUNT": return "warning";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Movements</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} movements recorded</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Movement Ledger</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search movements..."
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
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Before</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">After</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">User</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((mv) => (
                  <tr key={mv.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <p className="text-sm font-medium">{mv.product.name}</p>
                      <p className="text-xs text-gray-500">{mv.product.sku}</p>
                    </td>
                    <td className="py-3">
                      <Badge variant={getVariant(mv.type) as "success" | "info" | "default" | "destructive" | "warning" | "secondary"}>
                        {mv.type.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{mv.branch.name}</td>
                    <td className="py-3 text-right text-sm font-medium">{mv.quantity > 0 ? "+" : ""}{mv.quantity}</td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatNumber(mv.beforeQty)}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatNumber(mv.afterQty)}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{mv.user.name}</td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(mv.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {movements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No movements found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
