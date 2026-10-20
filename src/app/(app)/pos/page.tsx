export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { ShoppingCart, Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, User, Receipt } from "lucide-react";
import { POSClient } from "@/components/pos/pos-client";

export default async function POSPage() {
  const user = await requireUser();
  const orgId = user.orgId;
  const branchId = user.branchIds[0];

  const [products, customers, taxRate] = await Promise.all([
    prisma.product.findMany({
      where: { orgId, isActive: true },
      include: {
        stockBalances: {
          where: { branchId },
          select: { quantity: true },
        },
      },
      orderBy: { name: "asc" },
      take: 100,
    }),
    prisma.customer.findMany({
      where: { orgId, isActive: true },
      orderBy: { name: "asc" },
      take: 50,
    }),
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { taxRate: true },
    }),
  ]);

  const productsWithStock = products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    sellingPrice: Number(p.sellingPrice),
    taxRate: Number(p.taxRate),
    availableStock: p.stockBalances.reduce((sum, b) => sum + b.quantity, 0),
  }));

  const customersMapped = customers.map((c) => ({
    id: c.id,
    name: c.name,
    phone: c.phone ?? undefined,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Point of Sale</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Process sales and generate invoices</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Product Search & Grid */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Products</CardTitle>
            </CardHeader>
            <CardContent>
              <POSClient
                products={productsWithStock}
                customers={customersMapped}
                taxRate={Number(taxRate?.taxRate ?? 0)}
                branchId={branchId}
                userId={user.id}
                orgId={orgId}
              />
            </CardContent>
          </Card>
        </div>

        {/* Cart Summary */}
        <div>
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4" /> Current Sale
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-center text-sm text-gray-500 py-8">
                  <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                  <p>Scan or search products to add to cart</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
