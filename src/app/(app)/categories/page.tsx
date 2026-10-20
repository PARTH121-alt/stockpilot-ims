export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { Tag, Plus, Search } from "lucide-react";
import { CategoryForm } from "@/components/categories/category-form";

export default async function CategoriesPage({
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
      name: { contains: search, mode: "insensitive" as const },
    }),
  };

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
        products: { select: { id: true } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.category.count({ where }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} categories</p>
        </div>
        <CategoryForm>
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 cursor-pointer">
            <Plus className="h-4 w-4" /> Add Category
          </span>
        </CategoryForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Product Categories</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search categories..."
                className="flex h-9 w-64 rounded-md border border-gray-300 bg-white px-3 pl-9 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800"
                defaultValue={search}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <div key={category.id} className="rounded-lg border border-gray-200 p-4 dark:border-gray-700">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                    <Tag className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{category.name}</p>
                    <p className="text-xs text-gray-500">{formatNumber(category.products.length)} products</p>
                  </div>
                </div>
                {category.description && (
                  <p className="mt-2 text-xs text-gray-500">{category.description}</p>
                )}
              </div>
            ))}
          </div>
          {categories.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Tag className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No categories found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
