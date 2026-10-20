export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Receipt, ArrowLeft, User, MapPin, CreditCard, Download } from "lucide-react";
import Link from "next/link";

export default async function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const { id } = await params;

  const sale = await prisma.sale.findFirst({
    where: { id, orgId },
    include: {
      customer: { select: { name: true, email: true, phone: true } },
      user: { select: { name: true } },
      branch: { select: { name: true } },
      items: {
        include: { product: { select: { name: true, sku: true } } },
      },
      payments: true,
      refunds: true,
      invoice: true,
    },
  });

  if (!sale) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/sales">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-300 bg-white shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700 cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </span>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{sale.invoiceNumber}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{sale.branch.name}</p>
        </div>
        <Badge variant={sale.status === "COMPLETED" ? "success" : sale.status === "REFUNDED" ? "destructive" : "warning"}>
          {sale.status}
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sale Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sale.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium">{item.product.name}</p>
                    <p className="text-xs text-gray-500">{item.product.sku} • {item.quantity} × {formatCurrency(Number(item.unitPrice))}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(item.totalPrice))}</p>
                    {Number(item.discount) > 0 && (
                      <p className="text-xs text-red-500">Discount: -{formatCurrency(Number(item.discount))}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>{formatCurrency(Number(sale.subtotal))}</span>
              </div>
              {Number(sale.discountTotal) > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount</span>
                  <span>-{formatCurrency(Number(sale.discountTotal))}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>{formatCurrency(Number(sale.taxTotal))}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>{formatCurrency(Number(sale.totalAmount))}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-gray-400" />
                  {sale.customer?.name ?? "Walk-in Customer"}
                </div>
                {sale.customer?.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <CreditCard className="h-4 w-4" />
                    {sale.customer.phone}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {sale.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{payment.method}</span>
                    <span className="font-medium">{formatCurrency(Number(payment.amount))}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Cashier</span>
                <span>{sale.user.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Date</span>
                <span>{formatDateTime(sale.invoiceDate)}</span>
              </div>
              {sale.refunds.length > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Refunds</span>
                  <Badge variant="destructive">{sale.refunds.length}</Badge>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
