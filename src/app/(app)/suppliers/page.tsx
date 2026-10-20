export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Truck, Plus, Search, Star } from "lucide-react";
import { SupplierForm } from "@/components/suppliers/supplier-form";

export default async function SuppliersPage({
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
        { contactName: { contains: search, mode: "insensitive" as const } },
      ],
    }),
  };

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: {
        products: { select: { product: { select: { name: true } } } },
        purchaseOrders: { select: { totalAmount: true, status: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.supplier.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} suppliers</p>
        </div>
        <SupplierForm>
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 cursor-pointer">
            <Plus className="h-4 w-4" /> Add Supplier
          </span>
        </SupplierForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Supplier Directory</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search suppliers..."
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
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Products</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Orders</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Value</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => {
                  const totalValue = supplier.purchaseOrders.reduce((sum, po) => sum + Number(po.totalAmount), 0);
                  return (
                    <tr key={supplier.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900">
                            <Truck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{supplier.name}</p>
                            {supplier.gstin && <p className="text-xs text-gray-500">GSTIN: {supplier.gstin}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">{supplier.contactName ?? "—"}</p>
                        <p className="text-xs text-gray-500">{supplier.phone ?? "—"}</p>
                      </td>
                      <td className="py-3 text-right text-sm">{supplier.products.length}</td>
                      <td className="py-3 text-right text-sm">{supplier.purchaseOrders.length}</td>
                      <td className="py-3 text-right text-sm font-medium">{formatCurrency(totalValue)}</td>
                      <td className="py-3 text-right">
                        <Badge variant="success">Active</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {suppliers.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No suppliers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
