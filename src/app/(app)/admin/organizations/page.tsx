export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { Building2, Users, Package, BarChart3 } from "lucide-react";

export default async function OrganizationsPage() {
  const user = await requireUser();

  const organizations = await prisma.organization.findMany({
    include: {
      users: { select: { id: true } },
      branches: { select: { id: true } },
      products: { select: { id: true } },
      sales: { select: { totalAmount: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Organizations</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Platform administration</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {organizations.map((org) => {
          const totalRevenue = org.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
          return (
            <Card key={org.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900">
                      <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{org.name}</CardTitle>
                      <p className="text-xs text-gray-500">{org.slug}</p>
                    </div>
                  </div>
                  <Badge variant={org.isActive ? "success" : "secondary"}>
                    {org.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-lg font-bold">{formatNumber(org.users.length)}</p>
                    <p className="text-xs text-gray-500">Users</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatNumber(org.branches.length)}</p>
                    <p className="text-xs text-gray-500">Branches</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold">{formatNumber(org.products.length)}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
