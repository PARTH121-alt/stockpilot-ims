export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Phone } from "lucide-react";

export default async function BranchesPage() {
  const user = await requireUser();
  const orgId = user.orgId;

  const branches = await prisma.branch.findMany({
    where: { orgId },
    include: {
      warehouses: { select: { id: true, name: true } },
      users: { select: { id: true } },
      sales: { select: { totalAmount: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Branches</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{branches.length} locations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {branches.map((branch) => {
          const totalRevenue = branch.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0);
          return (
            <Card key={branch.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{branch.name}</CardTitle>
                  <Badge variant={branch.isActive ? "success" : "secondary"}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {branch.address ?? "No address"}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Phone className="h-4 w-4" />
                  {branch.phone ?? "No phone"}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Building2 className="h-4 w-4" />
                  {branch.warehouses.length} warehouses • {branch.users.length} staff
                </div>
                <div className="border-t border-gray-100 pt-3 dark:border-gray-700">
                  <p className="text-xs text-gray-500">Total Revenue</p>
                  <p className="text-lg font-bold">{formatCurrency(totalRevenue)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}
