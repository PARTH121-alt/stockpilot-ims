"use client";

import { formatDateTime } from "@/lib/utils";
import { Activity } from "lucide-react";

interface RecentActivityProps {
  activities: { id: string; action: string; entityType: string; createdAt: Date; user: { name: string } | null }[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  if (activities.length === 0) {
    return <p className="text-sm text-gray-500">No recent activity</p>;
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div key={activity.id} className="flex items-start gap-3">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900">
            <Activity className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-gray-900 dark:text-gray-100">
              <span className="font-medium">{activity.user?.name ?? "System"}</span>{" "}
              {activity.action} {activity.entityType}
            </p>
            <p className="text-xs text-gray-500">{formatDateTime(activity.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
