export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Users, Plus, Search } from "lucide-react";
import { CustomerForm } from "@/components/customers/customer-form";

export default async function CustomersPage({
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
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: {
        sales: { select: { totalAmount: true, invoiceDate: true } },
      },
      orderBy: { name: "asc" },
      take: 50,
    }),
    prisma.customer.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} customers</p>
        </div>
        <CustomerForm>
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 cursor-pointer">
            <Plus className="h-4 w-4" /> Add Customer
          </span>
        </CustomerForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Customer Directory</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search customers..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Orders</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Spent</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Last Order</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => {
                  const totalSpent = customer.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
                  const lastOrder = customer.sales.length > 0 ? customer.sales[0] : null;
                  return (
                    <tr key={customer.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                            <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{customer.name}</p>
                            {customer.gstin && <p className="text-xs text-gray-500">GSTIN: {customer.gstin}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{customer.phone ?? "—"}</p>
                        <p className="text-xs text-gray-500">{customer.email ?? "—"}</p>
                      </td>
                      <td className="py-3 text-right text-sm">{customer.sales.length}</td>
                      <td className="py-3 text-right text-sm font-medium">{formatCurrency(totalSpent)}</td>
                      <td className="py-3 text-right text-sm text-gray-500">
                        {lastOrder ? formatDateTime(lastOrder.invoiceDate) : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {customers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No customers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
