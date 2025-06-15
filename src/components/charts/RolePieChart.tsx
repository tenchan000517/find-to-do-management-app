"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface RolePieChartProps {
  data: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  height?: number;
}

export default function RolePieChart({ data, height = 300 }: RolePieChartProps) {
  if (data.length === 0) {
    return <p className="text-sm text-gray-500 text-center">データがありません</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={80}
          dataKey="value"
          label={({ name, value, percent }) => `${name}: ${value}人 (${(percent * 100).toFixed(1)}%)`}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(value: number) => [`${value}人`, '人数']} />
      </PieChart>
    </ResponsiveContainer>
  );
}