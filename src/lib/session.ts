import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getRolePermissions, type Permission } from "@/lib/permissions";
import { redirect } from "next/navigation";

export interface SessionUser {
  id: string;
  orgId: string;
  roleSlug: string;
  roleName: string;
  permissions: Permission[];
  branchIds: string[];
}

/**
 * Get the current session user with fresh permissions and branch access.
 * Use this in server components and server actions.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;

  // Fetch fresh permissions and branch access from DB
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: true,
      branchAccess: { select: { branchId: true } },
    },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    orgId: user.orgId,
    roleSlug: user.role.slug,
    roleName: user.role.name,
    permissions: getRolePermissions(user.role.slug),
    branchIds: user.branchAccess.map((b) => b.branchId),
  };
}

/**
 * Require an authenticated user or redirect to /login.
 */
export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Require a specific permission or throw/redirect.
 */
export async function requirePermission(permission: Permission): Promise<SessionUser> {
  const user = await requireUser();
  if (!user.permissions.includes(permission)) {
    redirect("/unauthorized");
  }
  return user;
}

/**
 * Check if user has permission (non-throwing).
 */
export async function checkPermission(permission: Permission): Promise<boolean> {
  const user = await getSessionUser();
  if (!user) return false;
  return user.permissions.includes(permission);
}

/**
 * Get the default dashboard path for a role.
 */
export function getDashboardPath(roleSlug: string): string {
  switch (roleSlug) {
    case "SUPER_ADMIN": return "/admin/organizations";
    case "OWNER": return "/dashboard/owner";
    case "SHOPKEEPER": return "/dashboard/shopkeeper";
    case "INVENTORY_MANAGER": return "/dashboard/inventory";
    case "STAFF": return "/dashboard/staff";
    case "PROCUREMENT": return "/dashboard/procurement";
    case "ACCOUNTANT": return "/dashboard/accounting";
    case "AUDITOR": return "/dashboard/audit";
    default: return "/dashboard";
  }
}
