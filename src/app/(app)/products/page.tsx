export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { Plus, Search, Package, AlertTriangle, Edit, Trash2 } from "lucide-react";
import Link from "next/link";
import { ProductForm } from "@/components/products/product-form";
import { FilterBar } from "@/components/filters/filter-bar";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const categoryId = params.category ?? "";
  const page = parseInt(params.page ?? "1");
  const pageSize = 20;

  const where = {
    orgId,
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { sku: { contains: search, mode: "insensitive" as const } },
        { barcode: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(categoryId && { categoryId }),
  };

  const [products, total, categories] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: { select: { name: true } },
        stockBalances: { select: { quantity: true } },
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({ where: { orgId }, orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} products in catalog</p>
        </div>
        <ProductForm>
          <Button>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </ProductForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Product Catalog</CardTitle>
            <FilterBar
              searchPlaceholder="Search products..."
              filters={[
                {
                  param: "category",
                  placeholder: "All Categories",
                  options: categories.map((cat) => ({ value: cat.id, label: cat.name })),
                },
              ]}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Stock</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const totalStock = product.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
                  return (
                    <tr key={product.id} className="border-b border-gray-100 dark:border-gray-700">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                            <Package className="h-5 w-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.brand ?? "No brand"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{product.sku}</td>
                      <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{product.category?.name ?? "—"}</td>
                      <td className="py-3 text-right text-sm font-medium">{formatCurrency(Number(product.sellingPrice))}</td>
                      <td className="py-3 text-right">
                        <Badge variant={totalStock === 0 ? "destructive" : totalStock <= 10 ? "warning" : "success"}>
                          {formatNumber(totalStock)}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No products found</p>
            </div>
          )}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                {page > 1 && (
                  <Link href={`/products?page=${page - 1}`}>
                    <Button variant="outline" size="sm">Previous</Button>
                  </Link>
                )}
                {page < totalPages && (
                  <Link href={`/products?page=${page + 1}`}>
                    <Button variant="outline" size="sm">Next</Button>
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
