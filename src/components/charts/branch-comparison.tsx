"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface BranchComparisonProps {
  branches: { id: string; name: string; sales: { totalAmount: number }[]; stockBalances: { quantity: number }[] }[];
}

export function BranchComparison({ branches }: BranchComparisonProps) {
  const data = branches.map((b) => ({
    name: b.name,
    revenue: b.sales.reduce((sum, s) => sum + Number(s.totalAmount), 0),
    stock: b.stockBalances.reduce((sum, s) => sum + s.quantity, 0),
  }));

  if (data.length === 0) {
    return <div className="flex h-[200px] items-center justify-center text-sm text-gray-500">No branch data</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
        <YAxis tick={{ fontSize: 10 }} />
        <Tooltip />
        <Bar dataKey="revenue" fill="#4f46e5" radius={[4, 4, 0, 0]} name="Revenue" />
      </BarChart>
    </ResponsiveContainer>
  );
}
