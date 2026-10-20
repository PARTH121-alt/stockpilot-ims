export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Shield, CheckCircle, XCircle, Clock } from "lucide-react";

export default async function ApprovalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; type?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const status = params.status ?? "";
  const type = params.type ?? "";

  const where: any = {
    orgId,
    ...(status && { status }),
    ...(type && { type }),
  };

  const [approvals, total, pendingCount, approvedCount, rejectedCount] = await Promise.all([
    prisma.approvalRequest.findMany({
      where,
      include: {
        requester: { select: { name: true, email: true } },
        reviewer: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.approvalRequest.count({ where }),
    prisma.approvalRequest.count({ where: { orgId, status: "PENDING" } }),
    prisma.approvalRequest.count({ where: { orgId, status: "APPROVED" } }),
    prisma.approvalRequest.count({ where: { orgId, status: "REJECTED" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Approvals</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} requests</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Approval Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested By</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branch</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Reviewer</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Date</th>
                </tr>
              </thead>
              <tbody>
                {approvals.map((approval) => (
                  <tr key={approval.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <Badge variant="outline">{approval.type.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{approval.requester.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{approval.branch.name}</td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{approval.reviewer?.name ?? "—"}</td>
                    <td className="py-3 text-right">
                      <Badge variant={
                        approval.status === "APPROVED" ? "success" :
                        approval.status === "REJECTED" ? "destructive" : "warning"
                      }>
                        {approval.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">{formatDateTime(approval.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {approvals.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Shield className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No approval requests found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
