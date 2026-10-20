export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, Plus, Search } from "lucide-react";
import { ExpenseForm } from "@/components/finance/expense-form";

export default async function ExpensesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const category = params.category ?? "";

  const where = {
    orgId,
    ...(search && {
      OR: [
        { description: { contains: search, mode: "insensitive" as const } },
        { category: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(category && { category }),
  };

  const [expenses, total, totalAmount] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: {
        branch: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { expenseDate: "desc" },
      take: 50,
    }),
    prisma.expense.count({ where }),
    prisma.expense.aggregate({ where, _sum: { amount: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Expenses</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} expenses • {formatCurrency(Number(totalAmount._sum?.amount ?? 0))} total</p>
        </div>
        <ExpenseForm>
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 cursor-pointer">
            <Plus className="h-4 w-4" /> Add Expense
          </span>
        </ExpenseForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Expense Records</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search expenses..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Description</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Recorded By</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <Badge variant="outline">{expense.category}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{expense.description ?? "—"}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{expense.branch.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{expense.user.name}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatCurrency(Number(expense.amount))}</td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDate(expense.expenseDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <DollarSign className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No expenses found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
