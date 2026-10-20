export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CreditCard, Search } from "lucide-react";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; method?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const method = params.method ?? "";

  const where: any = {
    orgId,
    ...(search && {
      OR: [
        { reference: { contains: search, mode: "insensitive" as const } },
        { sale: { invoiceNumber: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(method && { method }),
  };

  const [payments, total, totalAmount] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        sale: { select: { invoiceNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.payment.count({ where }),
    prisma.payment.aggregate({ where, _sum: { amount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payments</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} payments • {formatCurrency(Number(totalAmount._sum?.amount ?? 0))} total</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Payment Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search payments..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Method</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm font-medium">{payment.sale?.invoiceNumber ?? "—"}</td>
                    <td className="py-3">
                      <Badge variant="outline">{payment.method}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">{payment.reference ?? "—"}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatCurrency(Number(payment.amount))}</td>
                    <td className="py-3 text-right">
                      <Badge variant={payment.status === "COMPLETED" ? "success" : payment.status === "REFUNDED" ? "destructive" : "warning"}>
                        {payment.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(payment.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {payments.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <CreditCard className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No payments found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
