"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface TopProductsProps {
  data: { name: string; quantity: number; revenue: number }[];
}

export function TopProducts({ data }: TopProductsProps) {
  if (data.length === 0) {
    return <div className="flex h-[200px] items-center justify-center text-sm text-gray-500">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis type="number" tick={{ fontSize: 10 }} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={100} />
        <Tooltip />
        <Bar dataKey="quantity" fill="#4f46e5" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
