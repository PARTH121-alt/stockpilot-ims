export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Search, Package, Receipt, Truck, Users } from "lucide-react";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const q = params.q ?? "";

  if (!q) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Global search across products, orders, suppliers, and customers</p>
        </div>
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">Enter a search term to find records</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const [products, sales, suppliers, customers] = await Promise.all([
    prisma.product.findMany({
      where: {
        orgId,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { sku: { contains: q, mode: "insensitive" as const } },
          { barcode: { contains: q, mode: "insensitive" as const } },
        ],
      },
      take: 10,
      include: { stockBalances: { select: { quantity: true } } },
    }),
    prisma.sale.findMany({
      where: {
        orgId,
        OR: [
          { invoiceNumber: { contains: q, mode: "insensitive" as const } },
          { customer: { name: { contains: q, mode: "insensitive" as const } } },
        ],
      },
      take: 10,
      include: { customer: { select: { name: true } }, branch: { select: { name: true } } },
    }),
    prisma.supplier.findMany({
      where: {
        orgId,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { contactName: { contains: q, mode: "insensitive" as const } },
        ],
      },
      take: 10,
    }),
    prisma.customer.findMany({
      where: {
        orgId,
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { phone: { contains: q, mode: "insensitive" as const } },
          { email: { contains: q, mode: "insensitive" as const } },
        ],
      },
      take: 10,
    }),
  ]);

  const totalResults = products.length + sales.length + suppliers.length + customers.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {totalResults} results for &quot;{q}&quot;
        </p>
      </div>

      {products.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" /> Products ({products.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {products.map((product) => {
                const stock = product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
                return (
                  <div key={product.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                    <div>
                      <p className="text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(Number(product.sellingPrice))}</p>
                      <Badge variant={stock === 0 ? "destructive" : "success"}>{stock} in stock</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {sales.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-4 w-4" /> Sales ({sales.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sales.map((sale) => (
                <div key={sale.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium">{sale.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{sale.customer?.name ?? "Walk-in"} • {sale.branch.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{formatCurrency(Number(sale.totalAmount))}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(sale.invoiceDate)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {suppliers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4" /> Suppliers ({suppliers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium">{supplier.name}</p>
                    <p className="text-xs text-gray-500">{supplier.contactName ?? "—"}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {customers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Customers ({customers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {customers.map((customer) => (
                <div key={customer.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium">{customer.name}</p>
                    <p className="text-xs text-gray-500">{customer.phone ?? "—"}</p>
                  </div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {totalResults === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-12 w-12 mx-auto text-gray-300" />
            <p className="mt-4 text-sm text-gray-500">No results found for &quot;{q}&quot;</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
