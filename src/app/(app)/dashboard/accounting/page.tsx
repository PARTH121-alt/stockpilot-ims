export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { DollarSign, TrendingUp, Receipt, CreditCard, AlertTriangle, ArrowUpRight } from "lucide-react";

export default async function AccountingDashboard() {
  const user = await requireUser();
  const orgId = user.orgId;

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const [revenue, cogs, expenses, refunds, taxCollected, outstandingInvoices] = await Promise.all([
    prisma.sale.aggregate({ where: { orgId, invoiceDate: { gte: monthStart } }, _sum: { totalAmount: true, taxTotal: true } }),
    prisma.saleItem.aggregate({ where: { sale: { orgId, invoiceDate: { gte: monthStart } } }, _sum: { totalPrice: true } }),
    prisma.expense.aggregate({ where: { orgId, expenseDate: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.refund.aggregate({ where: { orgId, createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.payment.aggregate({ where: { orgId, createdAt: { gte: monthStart } }, _sum: { amount: true } }),
    prisma.purchaseOrder.count({ where: { orgId, status: { in: ["APPROVED", "PARTIALLY_RECEIVED"] } } }),
  ]);

  const totalRevenue = Number(revenue._sum.totalAmount ?? 0);
  const totalCOGS = Number(cogs._sum.totalPrice ?? 0);
  const grossProfit = totalRevenue - totalCOGS;
  const totalExpenses = Number(expenses._sum.amount ?? 0);
  const totalRefunds = Number(refunds._sum.amount ?? 0);
  const netProfit = grossProfit - totalExpenses - totalRefunds;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounting Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Financial overview and reconciliation</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Revenue (Month)</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Gross Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(grossProfit)}</div>
            <p className="text-xs text-gray-500">COGS: {formatCurrency(totalCOGS)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Expenses</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Net Profit</CardTitle>
            <CreditCard className="h-4 w-4 text-sky-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(netProfit)}</div>
            <p className="text-xs text-gray-500">Refunds: {formatCurrency(totalRefunds)}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Tax Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(Number(revenue._sum.taxTotal ?? 0))}</div>
            <p className="text-sm text-gray-500">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Outstanding Payables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{outstandingInvoices}</div>
            <p className="text-sm text-gray-500">Open purchase orders</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
