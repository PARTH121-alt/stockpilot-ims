"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Package, ArrowRight, Shield, Users, Truck, BarChart3, ShoppingCart, PackageSearch, ClipboardList, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DEMO_ACCOUNTS = [
  { email: "owner@urbanmart.demo", role: "Owner", icon: Shield, color: "bg-purple-100 text-purple-700", description: "Full access to organization, approvals, finance" },
  { email: "shopkeeper@urbanmart.demo", role: "Shopkeeper", icon: ShoppingCart, color: "bg-blue-100 text-blue-700", description: "POS, sales, branch inventory, customers" },
  { email: "inventory@urbanmart.demo", role: "Inventory Manager", icon: PackageSearch, color: "bg-emerald-100 text-emerald-700", description: "Stock, transfers, counts, adjustments" },
  { email: "staff@urbanmart.demo", role: "Staff", icon: Users, color: "bg-sky-100 text-sky-700", description: "Point of sale, customer registration" },
  { email: "procurement@urbanmart.demo", role: "Procurement", icon: Truck, color: "bg-amber-100 text-amber-700", description: "Suppliers, purchase orders, requisitions" },
  { email: "accountant@urbanmart.demo", role: "Accountant", icon: BarChart3, color: "bg-rose-100 text-rose-700", description: "Finance, expenses, reports, reconciliation" },
  { email: "auditor@urbanmart.demo", role: "Auditor", icon: Eye, color: "bg-gray-100 text-gray-700", description: "Read-only audit logs and reports" },
  { email: "admin@urbanmart.demo", role: "Super Admin", icon: ClipboardList, color: "bg-red-100 text-red-700", description: "Platform administration, organizations" },
];

export default function DemoAccessPage() {
  const router = useRouter();

  const handleDemoLogin = async (email: string) => {
    const result = await signIn("credentials", {
      email,
      password: process.env.DEMO_PASSWORD || "Demo@12345",
      redirect: false,
    });
    if (result?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600">
            <Package className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Demo Access</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            One-click login to explore every role dashboard. All data is simulated.
          </p>
          <Badge variant="warning" className="mt-3">Demo Mode — All payments simulated</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DEMO_ACCOUNTS.map((account) => {
            const Icon = account.icon;
            return (
              <Card key={account.email} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${account.color}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{account.role}</CardTitle>
                      <CardDescription className="text-xs">{account.email}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{account.description}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleDemoLogin(account.email)}
                  >
                    Login as {account.role} <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Button variant="link" onClick={() => router.push("/login")}>
            ← Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
