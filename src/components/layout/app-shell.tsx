"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

interface AppShellProps {
  roleSlug: string;
  permissions: string[];
  user: {
    name: string;
    email: string;
    roleName: string;
  };
  notificationCount: number;
  children: React.ReactNode;
}

export function AppShell({ roleSlug, permissions, user, notificationCount, children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        roleSlug={roleSlug}
        permissions={permissions}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden lg:pl-64">
        <Header
          user={user}
          onMenuClick={() => setSidebarOpen(true)}
          notificationCount={notificationCount}
        />
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
