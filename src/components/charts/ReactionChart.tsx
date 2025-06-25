"use client";

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface ReactionData {
  emoji: string;
  count: number;
}

interface ReactionChartProps {
  data: ReactionData[];
  height?: number;
}

// カラーパレット（最大10種類の絵文字用）
const COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange
  '#6366f1', // indigo
];

export default function ReactionChart({ data, height = 300 }: ReactionChartProps) {
  // カウントでソートして上位10個を取得
  const topReactions = data
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm text-gray-600">
            リアクション数: <span className="font-bold">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // 5%未満は表示しない

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (!topReactions || topReactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">リアクションデータがありません</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={topReactions}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          nameKey="emoji"
        >
          {topReactions.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          verticalAlign="middle" 
          align="right"
          layout="vertical"
          formatter={(value: string) => <span className="text-xs">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}