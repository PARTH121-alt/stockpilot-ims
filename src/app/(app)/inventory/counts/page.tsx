export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatNumber } from "@/lib/utils";
import { ClipboardList, Search } from "lucide-react";

export default async function InventoryCountsPage({
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
      branch: { name: { contains: search, mode: "insensitive" as const } },
    }),
    ...(status && { status }),
  };

  const [counts, total] = await Promise.all([
    prisma.stockCount.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.stockCount.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Counts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} counts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Physical Stock Counts</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search counts..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Counted By</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {counts.map((count) => (
                  <tr key={count.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{count.branch.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{count.items.length} items</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{count.user.name}</td>
                    <td className="py-3 text-right">
                      <Badge variant={
                        count.status === "COMPLETED" ? "success" :
                        count.status === "APPROVED" ? "default" : "secondary"
                      }>
                        {count.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(count.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {counts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No stock counts found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
