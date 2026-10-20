"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { CheckCheck } from "lucide-react";

interface NotificationsClientProps {
  userId: string;
}

export function NotificationsClient({ userId }: NotificationsClientProps) {
  const [isPending, startTransition] = useTransition();

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await fetch("/api/notifications/read-all", { method: "POST" });
      window.location.reload();
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleMarkAllRead} disabled={isPending}>
      <CheckCheck className="h-4 w-4" />
      {isPending ? "Marking..." : "Mark all read"}
    </Button>
  );
}
