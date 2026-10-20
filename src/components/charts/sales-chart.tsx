"use client";

import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export function SalesChart({ orgId }: { orgId: string }) {
  const [data, setData] = useState<{ date: string; revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/dashboard/sales-chart");
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (e) {
        console.error("Failed to fetch sales chart data:", e);
      }
      setLoading(false);
    }
    fetchData();
  }, [orgId]);

  if (loading) {
    return <div className="h-[200px] animate-pulse rounded bg-gray-100 dark:bg-gray-700" />;
  }

  if (data.length === 0) {
    return <div className="flex h-[200px] items-center justify-center text-sm text-gray-500">No sales data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
        <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v}`} />
        <Tooltip formatter={(value) => [`₹${value}`, "Revenue"]} />
        <Line type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
