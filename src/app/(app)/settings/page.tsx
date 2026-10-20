export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Settings as SettingsIcon, Building2, CreditCard, Bell, Shield } from "lucide-react";

export default async function SettingsPage() {
  const user = await requireUser();
  const orgId = user.orgId;

  const [organization, branches, settings] = await Promise.all([
    prisma.organization.findUnique({ where: { id: orgId } }),
    prisma.branch.findMany({ where: { orgId } }),
    prisma.systemSetting.findMany({ where: { orgId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Organization configuration</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Organization
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium">{organization?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Currency</span>
              <Badge variant="outline">{organization?.currency}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Timezone</span>
              <span className="text-sm">{organization?.timezone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Tax Rate</span>
              <span className="text-sm">{Number(organization?.taxRate)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Locale</span>
              <span className="text-sm">{organization?.locale}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                  <div>
                    <p className="text-sm font-medium">{branch.name}</p>
                    <p className="text-xs text-gray-500">{branch.code}</p>
                  </div>
                  <Badge variant={branch.isActive ? "success" : "secondary"}>
                    {branch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-4 w-4" /> Notification Preferences
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Low stock alerts</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Expiry alerts</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Approval notifications</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Email notifications</span>
              <Badge variant="secondary">Demo mode</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Session timeout</span>
              <Badge variant="outline">8 hours</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Password hashing</span>
              <Badge variant="success">bcrypt</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Audit logging</span>
              <Badge variant="success">Enabled</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Demo mode</span>
              <Badge variant="warning">Active</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
