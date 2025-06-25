"use client";

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ReactionBarData {
  channel: string;
  reactions: number;
}

interface ReactionBarChartProps {
  data: ReactionBarData[];
  height?: number;
}

export default function ReactionBarChart({ data, height = 300 }: ReactionBarChartProps) {
  // リアクション数でソートして上位10チャンネルを取得
  const topChannels = data
    .sort((a, b) => b.reactions - a.reactions)
    .slice(0, 10);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded shadow-lg border border-gray-200">
          <p className="text-sm font-medium">{payload[0].payload.channel}</p>
          <p className="text-sm text-gray-600">
            リアクション数: <span className="font-bold text-orange-600">{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (!topChannels || topChannels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-gray-500">チャンネル別リアクションデータがありません</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={topChannels} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="channel" 
          angle={-45}
          textAnchor="end"
          tick={{ fontSize: 12 }}
          height={100}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          label={{ value: 'リアクション数', angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="reactions" 
          fill="#f97316"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}