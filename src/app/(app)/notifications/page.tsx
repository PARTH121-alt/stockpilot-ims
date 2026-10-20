export const dynamic = "force-dynamic";

import { requireUser } from "@/lib/session";
import { getUserNotifications, markAllNotificationsRead } from "@/lib/notifications";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCheck, AlertTriangle, Package, Shield, ArrowLeftRight, RotateCcw, ShoppingCart } from "lucide-react";
import { NotificationsClient } from "@/components/notifications/notifications-client";

export default async function NotificationsPage() {
  const user = await requireUser();
  const notifications = await getUserNotifications(user.id, 50);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "LOW_STOCK": return Package;
      case "OUT_OF_STOCK": return AlertTriangle;
      case "EXPIRY": return AlertTriangle;
      case "APPROVAL": return Shield;
      case "TRANSFER": return ArrowLeftRight;
      case "REFUND": return RotateCcw;
      case "ORDER": return ShoppingCart;
      default: return Bell;
    }
  };

  const getVariant = (type: string) => {
    switch (type) {
      case "LOW_STOCK": return "warning";
      case "OUT_OF_STOCK": return "destructive";
      case "EXPIRY": return "warning";
      case "APPROVAL": return "default";
      case "TRANSFER": return "info";
      case "REFUND": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{unreadCount} unread</p>
        </div>
        {unreadCount > 0 && (
          <NotificationsClient userId={user.id} />
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {notifications.map((notification) => {
              const Icon = getIcon(notification.type);
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    notification.isRead
                      ? "border-gray-100 bg-white dark:border-gray-700 dark:bg-gray-800"
                      : "border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20"
                  }`}
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    notification.isRead ? "bg-gray-100 dark:bg-gray-700" : "bg-indigo-100 dark:bg-indigo-900"
                  }`}>
                    <Icon className={`h-4 w-4 ${notification.isRead ? "text-gray-400" : "text-indigo-600 dark:text-indigo-400"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-medium ${notification.isRead ? "text-gray-900 dark:text-gray-100" : "text-indigo-900 dark:text-indigo-100"}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <Badge variant="default" className="text-[10px]">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{notification.message}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDateTime(notification.createdAt)}</p>
                  </div>
                  <Badge variant={getVariant(notification.type) as "warning" | "destructive" | "default" | "info" | "secondary"} className="shrink-0">
                    {notification.type.replace(/_/g, " ")}
                  </Badge>
                </div>
              );
            })}
          </div>
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">No notifications</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
