"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface LowStockProduct {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  reorderLevel: number;
}

export function LowStockAlerts({ orgId }: { orgId: string }) {
  const [products, setProducts] = useState<LowStockProduct[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/low-stock");
        if (res.ok) {
          const json = await res.json();
          setProducts(json);
        }
      } catch (e) {
        console.error("Failed to fetch low stock data:", e);
      }
    }
    fetchData();
  }, [orgId]);

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-amber-800 dark:text-amber-200">Low Stock Alerts</h3>
      </div>
      {products.length === 0 ? (
        <p className="text-xs text-amber-700 dark:text-amber-300">All products well stocked</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div key={p.id} className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-amber-900 dark:text-amber-100">{p.name}</p>
                <p className="text-[10px] text-amber-600">{p.sku}</p>
              </div>
              <Badge variant={p.quantity === 0 ? "destructive" : "warning"}>
                {p.quantity} left
              </Badge>
            </div>
          ))}
        </div>
      )}
      <Link href="/inventory" className="mt-3 inline-flex items-center text-xs text-amber-700 hover:underline dark:text-amber-300">
        View inventory <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </div>
  );
}
