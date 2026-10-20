export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Receipt, Search } from "lucide-react";
import Link from "next/link";

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const status = params.status ?? "";
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;

  const where: { orgId: string; status?: "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "CANCELLED"; OR?: object[] } = {
    orgId,
    ...(search && {
      OR: [
        { invoiceNumber: { contains: search, mode: "insensitive" as const } },
        { customer: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status: status as "COMPLETED" | "REFUNDED" | "PARTIALLY_REFUNDED" | "CANCELLED" }),
  };

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { name: true } },
        user: { select: { name: true } },
        branch: { select: { name: true } },
        items: { select: { quantity: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { invoiceDate: "desc" },
    }),
    prisma.sale.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sales</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} transactions</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Sales History</CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  placeholder="Search invoices..."
                  className="flex h-9 w-64 rounded-md border border-gray-300 bg-white px-3 pl-9 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800"
                  defaultValue={search}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Cashier</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <Link href={`/sales/${sale.id}`} className="text-sm font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                        {sale.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{sale.customer?.name ?? "Walk-in"}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{sale.branch.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{sale.user.name}</td>
                    <td className="py-3 text-right text-sm">{sale.items.reduce((sum, i) => sum + i.quantity, 0)}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatCurrency(Number(sale.totalAmount))}</td>
                    <td className="py-3 text-right">
                      <Badge variant={sale.status === "COMPLETED" ? "success" : sale.status === "REFUNDED" ? "destructive" : "warning"}>
                        {sale.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(sale.invoiceDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sales.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No sales found</p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/sales?page=${page - 1}`}>
                    <span className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-sm">Previous</span>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/sales?page=${page + 1}`}>
                    <span className="inline-flex h-8 items-center rounded-md border border-gray-300 px-3 text-sm">Next</span>
                  </Link>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
