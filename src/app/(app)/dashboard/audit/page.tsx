export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { History, AlertTriangle, Shield, ArrowLeftRight, DollarSign } from "lucide-react";

export default async function AuditDashboard() {
  const user = await requireUser();
  const orgId = user.orgId;

  const [totalEvents, suspiciousActivity, recentEvents, adjustments, refunds] = await Promise.all([
    prisma.auditLog.count({ where: { orgId } }),
    prisma.auditLog.count({ where: { orgId, action: { contains: "SUSPICIOUS" } } }),
    prisma.auditLog.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: { user: { select: { name: true } }, branch: { select: { name: true } } },
    }),
    prisma.stockAdjustment.count({ where: { orgId } }),
    prisma.refund.count({ where: { orgId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Audit Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Immutable audit trail and compliance monitoring</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Events</CardTitle>
            <History className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEvents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Suspicious Activity</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{suspiciousActivity}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Adjustments</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{adjustments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Refunds</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{refunds}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Audit Event Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 border-b border-gray-100 pb-3 last:border-0 dark:border-gray-700">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <Shield className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    <span className="font-medium">{event.user?.name ?? "System"}</span>{" "}
                    {event.action} on {event.entityType}
                  </p>
                  <p className="text-xs text-gray-500">
                    {event.branch?.name ?? "N/A"} • {formatDateTime(event.createdAt)}
                  </p>
                </div>
                <Badge variant="outline">{event.entityType}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
