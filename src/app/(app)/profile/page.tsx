export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { User, Mail, Phone, Shield, Clock } from "lucide-react";

export default async function ProfilePage() {
  const user = await requireUser();

  const userData = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      role: true,
      branchAccess: { include: { branch: { select: { name: true } } } },
    },
  });

  if (!userData) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Your account information</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" /> Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Name</span>
              <span className="text-sm font-medium">{userData.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Email</span>
              <span className="text-sm">{userData.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Phone</span>
              <span className="text-sm">{userData.phone ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Role</span>
              <Badge variant="outline">{userData.role.name}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Access & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Branch Access</span>
              <span className="text-sm">
                {userData.branchAccess.map((ba) => ba.branch.name).join(", ") || "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Last Login</span>
              <span className="text-sm">{userData.lastLoginAt ? formatDateTime(userData.lastLoginAt) : "Never"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Account Created</span>
              <span className="text-sm">{formatDateTime(userData.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">Demo Account</span>
              <Badge variant={userData.isDemo ? "warning" : "secondary"}>
                {userData.isDemo ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
