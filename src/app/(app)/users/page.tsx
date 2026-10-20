export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Users, Plus, Search } from "lucide-react";
import { UserForm } from "@/components/users/user-form";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; role?: string }>;
}) {
  const user = await requireUser();
  const orgId = user.orgId;
  const params = await searchParams;
  const search = params.q ?? "";
  const role = params.role ?? "";

  const where = {
    orgId,
    isActive: true,
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(role && { role: { slug: role } }),
  };

  const [users, total, roles] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        role: { select: { name: true, slug: true } },
        branchAccess: { include: { branch: { select: { name: true } } } },
      },
      orderBy: { name: "asc" },
      take: 50,
    }),
    prisma.user.count({ where }),
    prisma.role.findMany({ where: { orgId } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} users</p>
        </div>
        <UserForm>
          <span className="inline-flex h-9 items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 cursor-pointer">
            <Plus className="h-4 w-4" /> Add User
          </span>
        </UserForm>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>User Management</CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Search users..."
                className="flex h-9 w-64 rounded-md border border-gray-300 bg-white px-3 pl-9 text-sm shadow-sm dark:border-gray-600 dark:bg-gray-800"
                defaultValue={search}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Name</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Email</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Role</th>
                  <th className="pb-3 text-left text-xs font-semibold text-gray-500 uppercase">Branches</th>
                  <th className="pb-3 text-right text-xs font-semibold text-gray-500 uppercase">Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
                          <Users className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="text-sm font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-sm text-gray-600 dark:text-gray-300">{u.email}</td>
                    <td className="py-3">
                      <Badge variant="outline">{u.role.name}</Badge>
                    </td>
                    <td className="py-3 text-sm text-gray-500">
                      {u.branchAccess.map((ba) => ba.branch.name).join(", ") || "—"}
                    </td>
                    <td className="py-3 text-right text-sm text-gray-500">
                      {u.lastLoginAt ? formatDateTime(u.lastLoginAt) : "Never"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No users found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
