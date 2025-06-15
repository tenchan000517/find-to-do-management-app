"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RoleLineChartProps {
  data: Array<{
    date: string;
    [key: string]: string | number;
  }>;
  lines: Array<{
    dataKey: string;
    stroke: string;
    name?: string;
  }>;
  height?: number;
}

export default function RoleLineChart({ data, lines, height = 250 }: RoleLineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        {lines.map((line, index) => (
          <Line
            key={line.dataKey}
            type="monotone"
            dataKey={line.dataKey}
            stroke={line.stroke}
            strokeWidth={2}
            name={line.name || line.dataKey}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}