export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ArrowLeftRight, Search } from "lucide-react";

export default async function GoodsReceiptsPage({
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
        { receiptNumber: { contains: search, mode: "insensitive" as const } },
        { supplier: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status }),
  };

  const [receipts, total] = await Promise.all([
    prisma.goodsReceipt.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        branch: { select: { name: true } },
        purchaseOrder: { select: { orderNumber: true } },
        items: { include: { product: { select: { name: true } } } },
        user: { select: { name: true } },
      },
      orderBy: { receiptDate: "desc" },
      take: 50,
    }),
    prisma.goodsReceipt.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Goods Receipts</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} receipts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Goods Receipt Notes (GRN)</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search receipts..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Receipt #</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">PO Number</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {receipts.map((receipt) => (
                  <tr key={receipt.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm font-medium">{receipt.receiptNumber}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{receipt.purchaseOrder?.orderNumber ?? "—"}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{receipt.supplier.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{receipt.branch.name}</td>
                    <td className="py-3 text-right text-sm">{receipt.items.length}</td>
                    <td className="py-3 text-right">
                      <Badge variant={receipt.status === "POSTED" ? "success" : "secondary"}>
                        {receipt.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDate(receipt.receiptDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {receipts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <ArrowLeftRight className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No goods receipts found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
