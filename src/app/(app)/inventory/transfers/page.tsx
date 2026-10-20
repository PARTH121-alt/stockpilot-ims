export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight, Search } from "lucide-react";

export default async function InventoryTransfersPage({
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
      OR: [
        { fromBranch: { name: { contains: search, mode: "insensitive" as const } } },
        { toBranch: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status }),
  };

  const [transfers, total] = await Promise.all([
    prisma.stockTransfer.findMany({
      where,
      include: {
        fromBranch: { select: { name: true } },
        toBranch: { select: { name: true } },
        user: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.stockTransfer.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stock Transfers</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} transfers</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Inter-Branch Transfers</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search transfers..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">From</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">To</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer) => (
                  <tr key={transfer.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{transfer.fromBranch.name}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <ArrowRight className="h-3 w-3" />
                        {transfer.toBranch.name}
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{transfer.items.length} items</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{transfer.user.name}</td>
                    <td className="py-3 text-right">
                      <Badge variant={
                        transfer.status === "COMPLETED" ? "success" :
                        transfer.status === "IN_TRANSIT" ? "info" :
                        transfer.status === "APPROVED" ? "default" :
                        transfer.status === "REJECTED" ? "destructive" : "secondary"
                      }>
                        {transfer.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(transfer.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {transfers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowRight className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No transfers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
