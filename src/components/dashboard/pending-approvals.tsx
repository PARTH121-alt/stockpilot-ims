"use client";

import { useEffect, useState } from "react";
import { Shield, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import Link from "next/link";

interface PendingApproval {
  id: string;
  type: string;
  createdAt: string;
  requester: { name: string };
}

export function PendingApprovals({ orgId }: { orgId: string }) {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/pending-approvals");
        if (res.ok) {
          const json = await res.json();
          setApprovals(json);
        }
      } catch (e) {
        console.error("Failed to fetch pending approvals:", e);
      }
    }
    fetchData();
  }, [orgId]);

  return (
    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-900/20">
      <div className="mb-3 flex items-center gap-2">
        <Shield className="h-4 w-4 text-indigo-600" />
        <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-200">Pending Approvals</h3>
      </div>
      {approvals.length === 0 ? (
        <p className="text-xs text-indigo-700 dark:text-indigo-300">No pending approvals</p>
      ) : (
        <div className="space-y-2">
          {approvals.map((a) => (
            <div key={a.id} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-indigo-900 dark:text-indigo-100">{a.type.replace(/_/g, " ")}</p>
                <p className="text-xs text-indigo-600">{a.requester.name} • {formatDateTime(a.createdAt)}</p>
              </div>
              <Badge variant="warning">Pending</Badge>
            </div>
          ))}
        </div>
      )}
      <Link href="/approvals" className="mt-3 inline-flex items-center text-xs text-indigo-700 hover:underline dark:text-indigo-300">
        View all <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </div>
  );
}
