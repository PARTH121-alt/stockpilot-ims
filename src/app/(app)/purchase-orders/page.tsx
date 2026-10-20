export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { FileText, Plus, Search } from "lucide-react";
import { POForm } from "@/components/procurement/po-form";

export default async function PurchaseOrdersPage({
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
        { orderNumber: { contains: search, mode: "insensitive" as const } },
        { supplier: { name: { contains: search, mode: "insensitive" as const } } },
      ],
    }),
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: {
        supplier: { select: { name: true } },
        branch: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} orders</p>
        </div>
        <POForm>
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 cursor-pointer">
            <Plus className="h-4 w-4" /> New PO
          </span>
        </POForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>All Purchase Orders</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search POs..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">PO Number</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Items</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3 text-sm font-medium">{order.orderNumber}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{order.supplier.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{order.branch.name}</td>
                    <td className="py-3 text-right text-sm">{order.items.length}</td>
                    <td className="py-3 text-right text-sm font-medium">{formatCurrency(Number(order.totalAmount))}</td>
                    <td className="py-3 text-right">
                      <Badge variant={
                        order.status === "RECEIVED" ? "success" :
                        order.status === "APPROVED" ? "default" :
                        order.status === "PARTIALLY_RECEIVED" ? "info" :
                        order.status === "CANCELLED" ? "destructive" : "secondary"
                      }>
                        {order.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDate(order.orderDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {orders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No purchase orders found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
