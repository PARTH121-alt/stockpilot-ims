"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  Truck,
  Receipt,
  BarChart3,
  Settings,
  Shield,
  ClipboardList,
  ArrowLeftRight,
  AlertTriangle,
  FileText,
  Bell,
  Search,
  Building2,
  CreditCard,
  UserCog,
  History,
  Boxes,
  Tag,
  DollarSign,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  permission?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: Record<string, NavSection[]> = {
  SUPER_ADMIN: [
    {
      title: "Administration",
      items: [
        { href: "/admin/organizations", label: "Organizations", icon: Building2, permission: "org:view" },
        { href: "/users", label: "Users", icon: Users, permission: "users:view" },
        { href: "/roles-permissions", label: "Roles & Permissions", icon: Shield, permission: "roles:view" },
        { href: "/audit-logs", label: "Audit Logs", icon: History, permission: "audit:view" },
        { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      ],
    },
  ],
  OWNER: [
    {
      title: "Overview",
      items: [
        { href: "/dashboard/owner", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
        { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports:view" },
      ],
    },
    {
      title: "Operations",
      items: [
        { href: "/branches", label: "Branches", icon: Building2, permission: "branches:view" },
        { href: "/warehouses", label: "Warehouses", icon: Warehouse, permission: "warehouses:view" },
        { href: "/products", label: "Products", icon: Package, permission: "products:view" },
        { href: "/inventory", label: "Inventory", icon: Boxes, permission: "inventory:view" },
        { href: "/pos", label: "Point of Sale", icon: ShoppingCart, permission: "pos:access" },
        { href: "/sales", label: "Sales", icon: Receipt, permission: "sales:view" },
      ],
    },
    {
      title: "Procurement",
      items: [
        { href: "/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers:view" },
        { href: "/purchase-requests", label: "Requisitions", icon: ClipboardList, permission: "requisitions:view" },
        { href: "/purchase-orders", label: "Purchase Orders", icon: FileText, permission: "purchase:view" },
        { href: "/goods-receipts", label: "Goods Receipts", icon: ArrowLeftRight, permission: "inventory:receive" },
      ],
    },
    {
      title: "Finance",
      items: [
        { href: "/expenses", label: "Expenses", icon: DollarSign, permission: "finance:view" },
        { href: "/payments", label: "Payments", icon: CreditCard, permission: "finance:view" },
        { href: "/approvals", label: "Approvals", icon: Shield, permission: "approvals:view" },
      ],
    },
    {
      title: "People",
      items: [
        { href: "/customers", label: "Customers", icon: Users, permission: "customers:view" },
        { href: "/users", label: "Users", icon: UserCog, permission: "users:view" },
        { href: "/roles-permissions", label: "Roles", icon: Shield, permission: "roles:view" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view" },
        { href: "/audit-logs", label: "Audit Logs", icon: History, permission: "audit:view" },
        { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      ],
    },
  ],
  SHOPKEEPER: [
    {
      title: "Overview",
      items: [
        { href: "/dashboard/shopkeeper", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      ],
    },
    {
      title: "Sales",
      items: [
        { href: "/pos", label: "Point of Sale", icon: ShoppingCart, permission: "pos:access" },
        { href: "/sales", label: "Sales History", icon: Receipt, permission: "sales:view" },
        { href: "/returns", label: "Returns", icon: ArrowLeftRight, permission: "sales:refund" },
      ],
    },
    {
      title: "Inventory",
      items: [
        { href: "/inventory", label: "Inventory", icon: Boxes, permission: "inventory:view" },
        { href: "/products", label: "Products", icon: Package, permission: "products:view" },
        { href: "/batches-expiry", label: "Batches & Expiry", icon: AlertTriangle, permission: "batches:view" },
      ],
    },
    {
      title: "People",
      items: [
        { href: "/customers", label: "Customers", icon: Users, permission: "customers:view" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view" },
        { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      ],
    },
  ],
  INVENTORY_MANAGER: [
    {
      title: "Overview",
      items: [
        { href: "/dashboard/inventory", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      ],
    },
    {
      title: "Inventory",
      items: [
        { href: "/products", label: "Products", icon: Package, permission: "products:view" },
        { href: "/inventory", label: "Stock Levels", icon: Boxes, permission: "inventory:view" },
        { href: "/inventory/movements", label: "Movements", icon: ArrowLeftRight, permission: "inventory:view" },
        { href: "/inventory/transfers", label: "Transfers", icon: ArrowLeftRight, permission: "inventory:transfer" },
        { href: "/inventory/counts", label: "Stock Counts", icon: ClipboardList, permission: "inventory:count" },
        { href: "/inventory/adjustments", label: "Adjustments", icon: Tag, permission: "inventory:adjust" },
        { href: "/batches-expiry", label: "Batches & Expiry", icon: AlertTriangle, permission: "batches:view" },
      ],
    },
    {
      title: "Procurement",
      items: [
        { href: "/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers:view" },
        { href: "/purchase-requests", label: "Requisitions", icon: ClipboardList, permission: "requisitions:view" },
        { href: "/purchase-orders", label: "Purchase Orders", icon: FileText, permission: "purchase:view" },
        { href: "/goods-receipts", label: "Goods Receipts", icon: ArrowLeftRight, permission: "inventory:receive" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view" },
        { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      ],
    },
  ],
  STAFF: [
    {
      title: "Overview",
      items: [
        { href: "/dashboard/staff", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      ],
    },
    {
      title: "Sales",
      items: [
        { href: "/pos", label: "Point of Sale", icon: ShoppingCart, permission: "pos:access" },
        { href: "/sales", label: "My Sales", icon: Receipt, permission: "sales:view" },
      ],
    },
    {
      title: "People",
      items: [
        { href: "/customers", label: "Customers", icon: Users, permission: "customers:view" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view" },
      ],
    },
  ],
  PROCUREMENT: [
    {
      title: "Overview",
      items: [
        { href: "/dashboard/procurement", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      ],
    },
    {
      title: "Procurement",
      items: [
        { href: "/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers:view" },
        { href: "/purchase-requests", label: "Requisitions", icon: ClipboardList, permission: "requisitions:view" },
        { href: "/purchase-orders", label: "Purchase Orders", icon: FileText, permission: "purchase:view" },
        { href: "/goods-receipts", label: "Goods Receipts", icon: ArrowLeftRight, permission: "inventory:receive" },
      ],
    },
    {
      title: "Inventory",
      items: [
        { href: "/products", label: "Products", icon: Package, permission: "products:view" },
        { href: "/inventory", label: "Stock Levels", icon: Boxes, permission: "inventory:view" },
        { href: "/batches-expiry", label: "Batches & Expiry", icon: AlertTriangle, permission: "batches:view" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view" },
        { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      ],
    },
  ],
  ACCOUNTANT: [
    {
      title: "Overview",
      items: [
        { href: "/dashboard/accounting", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
        { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports:view" },
      ],
    },
    {
      title: "Finance",
      items: [
        { href: "/sales", label: "Sales", icon: Receipt, permission: "sales:view" },
        { href: "/expenses", label: "Expenses", icon: DollarSign, permission: "finance:view" },
        { href: "/payments", label: "Payments", icon: CreditCard, permission: "finance:view" },
        { href: "/returns", label: "Refunds", icon: ArrowLeftRight, permission: "sales:view" },
      ],
    },
    {
      title: "Procurement",
      items: [
        { href: "/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers:view" },
        { href: "/purchase-orders", label: "Purchase Orders", icon: FileText, permission: "purchase:view" },
        { href: "/goods-receipts", label: "Goods Receipts", icon: ArrowLeftRight, permission: "inventory:receive" },
      ],
    },
    {
      title: "System",
      items: [
        { href: "/notifications", label: "Notifications", icon: Bell, permission: "notifications:view" },
        { href: "/settings", label: "Settings", icon: Settings, permission: "settings:manage" },
      ],
    },
  ],
  AUDITOR: [
    {
      title: "Overview",
      items: [
        { href: "/dashboard/audit", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view" },
      ],
    },
    {
      title: "Audit",
      items: [
        { href: "/audit-logs", label: "Audit Logs", icon: History, permission: "audit:view" },
        { href: "/reports", label: "Reports", icon: BarChart3, permission: "reports:view" },
        { href: "/inventory/movements", label: "Stock Movements", icon: ArrowLeftRight, permission: "inventory:view" },
        { href: "/approvals", label: "Approvals", icon: Shield, permission: "approvals:view" },
      ],
    },
    {
      title: "Data",
      items: [
        { href: "/sales", label: "Sales", icon: Receipt, permission: "sales:view" },
        { href: "/products", label: "Products", icon: Package, permission: "products:view" },
        { href: "/customers", label: "Customers", icon: Users, permission: "customers:view" },
        { href: "/suppliers", label: "Suppliers", icon: Truck, permission: "suppliers:view" },
      ],
    },
  ],
};

export function Sidebar({
  roleSlug,
  permissions,
  isOpen,
  onClose,
}: {
  roleSlug: string;
  permissions: string[];
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const sections = NAV_SECTIONS[roleSlug] ?? [];

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-slate-900 text-white transition-transform duration-200 lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-700 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold">StockPilot</div>
            <div className="text-[10px] text-slate-400">IMS Platform</div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {sections.map((section) => {
            const visibleItems = section.items.filter(
              (item) => !item.permission || permissions.includes(item.permission)
            );
            if (visibleItems.length === 0) return null;
            return (
              <div key={section.title} className="mb-4">
                <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  {section.title}
                </div>
                {visibleItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        "mb-0.5 flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "text-slate-300 hover:bg-slate-800 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="border-t border-slate-700 p-3">
          <Link
            href="/demo-access"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            <Search className="h-4 w-4" />
            Demo Access
          </Link>
        </div>
      </aside>
    </>
  );
}
