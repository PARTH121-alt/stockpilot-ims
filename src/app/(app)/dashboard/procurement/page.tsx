export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { Truck, FileText, ClipboardList, Clock, AlertTriangle, CheckCircle } from "lucide-react";

export default async function ProcurementDashboard() {
  const user = await requireUser();
  const orgId = user.orgId;

  const [openPOs, pendingApprovals, pendingRequisitions, delayedOrders, recentPOs, supplierCount] = await Promise.all([
    prisma.purchaseOrder.count({ where: { orgId, status: { in: ["APPROVED", "PARTIALLY_RECEIVED"] } } }),
    prisma.approvalRequest.count({ where: { orgId, status: "PENDING", type: "PURCHASE_ORDER" } }),
    prisma.purchaseRequisition.count({ where: { orgId, status: "PENDING" } }),
    prisma.purchaseOrder.count({ where: { orgId, status: "APPROVED", expectedDate: { lt: new Date() } } }),
    prisma.purchaseOrder.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { supplier: { select: { name: true } }, branch: { select: { name: true } } },
    }),
    prisma.supplier.count({ where: { orgId, isActive: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Procurement Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Purchase orders, suppliers, and requisitions</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Open POs</CardTitle>
            <FileText className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openPOs}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Approvals</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingApprovals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Delayed Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{delayedOrders}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Suppliers</CardTitle>
            <Truck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{supplierCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentPOs.map((po) => (
              <div key={po.id} className="flex items-center justify-between border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                <div>
                  <p className="text-sm font-medium">{po.orderNumber}</p>
                  <p className="text-xs text-gray-500">{po.supplier.name} • {po.branch.name}</p>
                </div>
                <div className="text-right">
                  <Badge variant={po.status === "RECEIVED" ? "success" : po.status === "APPROVED" ? "default" : "secondary"}>
                    {po.status.replace(/_/g, " ")}
                  </Badge>
                  <p className="text-xs text-gray-500">{formatCurrency(Number(po.totalAmount))}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
