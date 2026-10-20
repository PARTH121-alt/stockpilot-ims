export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/utils";
import { Warehouse as WarehouseIcon, MapPin, Boxes } from "lucide-react";

export default async function WarehousesPage() {
  const user = await requireUser();
  const orgId = user.orgId;

  const warehouses = await prisma.warehouse.findMany({
    where: { orgId },
    include: {
      branch: { select: { name: true } },
      storageLocations: { select: { id: true, name: true } },
      stockBalances: { select: { quantity: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Warehouses</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{warehouses.length} warehouses</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {warehouses.map((warehouse) => {
          const totalStock = warehouse.stockBalances.reduce((sum, b) => sum + b.quantity, 0);
          return (
            <Card key={warehouse.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{warehouse.name}</CardTitle>
                  <Badge variant={warehouse.isActive ? "success" : "secondary"}>
                    {warehouse.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="h-4 w-4" />
                  {warehouse.branch.name}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Boxes className="h-4 w-4" />
                  {formatNumber(totalStock)} units in stock
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <WarehouseIcon className="h-4 w-4" />
                  {warehouse.storageLocations.length} storage locations
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
