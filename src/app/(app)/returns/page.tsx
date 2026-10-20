export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { RotateCcw, Search } from "lucide-react";

export default async function ReturnsPage({
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
      sale: { invoiceNumber: { contains: search, mode: "insensitive" as const } },
    }),
    ...(status && { status }),
  };

  const [refunds, total] = await Promise.all([
    prisma.refund.findMany({
      where,
      include: {
        sale: { select: { invoiceNumber: true, totalAmount: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.refund.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Returns & Refunds</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} refund requests</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Refund Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search refunds..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Reason</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((refund) => (
                  <tr key={refund.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm font-medium">{refund.sale?.invoiceNumber ?? "—"}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{refund.reason}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{refund.user.name}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatCurrency(Number(refund.amount))}</td>
                    <td className="py-3 text-right">
                      <Badge variant={
                        refund.status === "APPROVED" ? "success" :
                        refund.status === "REJECTED" ? "destructive" : "warning"
                      }>
                        {refund.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(refund.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {refunds.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <RotateCcw className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No refunds found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
