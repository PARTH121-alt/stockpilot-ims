// Centralized permission definitions and role-based access control.
// Every protected server action checks permissions via `requirePermission`.

export const PERMISSIONS = {
  // Dashboard & org
  "dashboard:view": "View dashboards",
  "org:manage": "Manage organization settings",
  "org:view": "View organization",

  // Users & roles
  "users:manage": "Manage users",
  "users:view": "View users",
  "roles:manage": "Manage roles & permissions",
  "roles:view": "View roles",

  // Branches & warehouses
  "branches:manage": "Manage branches",
  "branches:view": "View branches",
  "warehouses:manage": "Manage warehouses",
  "warehouses:view": "View warehouses",

  // Products & inventory
  "products:manage": "Manage products & catalog",
  "products:view": "View products",
  "inventory:view": "View inventory",
  "inventory:adjust": "Adjust stock",
  "inventory:transfer": "Transfer stock",
  "inventory:count": "Perform stock counts",
  "inventory:receive": "Receive goods",
  "batches:view": "View batches & expiry",

  // Sales & POS
  "sales:view": "View sales",
  "sales:create": "Create sales / POS",
  "sales:refund": "Process refunds",
  "pos:access": "Access point of sale",
  "discount:apply": "Apply discounts",

  // Customers
  "customers:manage": "Manage customers",
  "customers:view": "View customers",

  // Suppliers & procurement
  "suppliers:manage": "Manage suppliers",
  "suppliers:view": "View suppliers",
  "purchase:manage": "Manage purchase orders",
  "purchase:view": "View purchases",
  "purchase:approve": "Approve purchase orders",
  "requisitions:manage": "Manage requisitions",
  "requisitions:view": "View requisitions",

  // Finance
  "finance:view": "View financial data",
  "finance:manage": "Manage expenses & payments",
  "reports:view": "View reports",
  "reports:export": "Export reports",

  // Approvals
  "approvals:manage": "Manage approvals",
  "approvals:view": "View approvals",

  // Audit & settings
  "audit:view": "View audit logs",
  "settings:manage": "Manage settings",
  "notifications:view": "View notifications",
} as const;

export type Permission = keyof typeof PERMISSIONS;

// Role → permission mapping. System roles.
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  SUPER_ADMIN: Object.keys(PERMISSIONS) as Permission[],
  OWNER: [
    "dashboard:view", "org:manage", "org:view",
    "users:manage", "users:view", "roles:manage", "roles:view",
    "branches:manage", "branches:view", "warehouses:manage", "warehouses:view",
    "products:manage", "products:view", "inventory:view", "inventory:adjust",
    "inventory:transfer", "inventory:count", "inventory:receive", "batches:view",
    "sales:view", "sales:create", "sales:refund", "pos:access", "discount:apply",
    "customers:manage", "customers:view",
    "suppliers:manage", "suppliers:view", "purchase:manage", "purchase:view",
    "purchase:approve", "requisitions:manage", "requisitions:view",
    "finance:view", "finance:manage", "reports:view", "reports:export",
    "approvals:manage", "approvals:view", "audit:view", "settings:manage",
    "notifications:view",
  ],
  SHOPKEEPER: [
    "dashboard:view", "org:view",
    "branches:view", "warehouses:view",
    "products:view", "inventory:view", "batches:view",
    "sales:view", "sales:create", "sales:refund", "pos:access", "discount:apply",
    "customers:manage", "customers:view",
    "suppliers:view", "purchase:view", "requisitions:view",
    "reports:view", "approvals:view", "notifications:view",
  ],
  INVENTORY_MANAGER: [
    "dashboard:view", "org:view",
    "branches:view", "warehouses:view", "warehouses:manage",
    "products:manage", "products:view", "inventory:view", "inventory:adjust",
    "inventory:transfer", "inventory:count", "inventory:receive", "batches:view",
    "sales:view", "customers:view",
    "suppliers:view", "purchase:view", "requisitions:manage", "requisitions:view",
    "reports:view", "approvals:view", "notifications:view",
  ],
  STAFF: [
    "dashboard:view", "org:view",
    "branches:view", "products:view", "inventory:view",
    "sales:view", "sales:create", "pos:access", "discount:apply",
    "customers:manage", "customers:view",
    "notifications:view",
  ],
  PROCUREMENT: [
    "dashboard:view", "org:view",
    "branches:view", "warehouses:view",
    "products:view", "inventory:view", "batches:view",
    "suppliers:manage", "suppliers:view",
    "purchase:manage", "purchase:view", "requisitions:manage", "requisitions:view",
    "reports:view", "approvals:view", "notifications:view",
  ],
  ACCOUNTANT: [
    "dashboard:view", "org:view",
    "branches:view", "warehouses:view",
    "products:view", "inventory:view", "batches:view",
    "sales:view", "customers:view",
    "suppliers:view", "purchase:view", "requisitions:view",
    "finance:view", "finance:manage", "reports:view", "reports:export",
    "approvals:view", "notifications:view",
  ],
  AUDITOR: [
    "dashboard:view", "org:view",
    "branches:view", "warehouses:view",
    "products:view", "inventory:view", "batches:view",
    "sales:view", "customers:view",
    "suppliers:view", "purchase:view", "requisitions:view",
    "finance:view", "reports:view", "reports:export",
    "approvals:view", "audit:view", "notifications:view",
  ],
};

export function getRolePermissions(roleSlug: string): Permission[] {
  return ROLE_PERMISSIONS[roleSlug] ?? [];
}

export function hasPermission(userPerms: Permission[], required: Permission): boolean {
  return userPerms.includes(required);
}

export function hasAnyPermission(userPerms: Permission[], required: Permission[]): boolean {
  return required.some((p) => userPerms.includes(p));
}
