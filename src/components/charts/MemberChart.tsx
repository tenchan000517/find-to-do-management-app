"use client";

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MemberChartProps {
  data: Array<{
    date: string;
    memberCount: number;
    newMembers: number;
  }>;
  height?: number;
}

export default function MemberChart({ data, height = 250 }: MemberChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        {/* 左側Y軸：総メンバー数用 */}
        <YAxis 
          yAxisId="memberCount"
          orientation="left"
          label={{ value: '総メンバー数（人）', angle: -90, position: 'insideLeft' }}
        />
        {/* 右側Y軸：新規参加用 */}
        <YAxis 
          yAxisId="newMembers"
          orientation="right"
          label={{ value: '新規参加（人）', angle: 90, position: 'insideRight' }}
        />
        <Tooltip 
          formatter={(value: number, name: string) => [
            `${value}人`,
            name === 'memberCount' ? '総メンバー数' : '新規参加'
          ]}
        />
        <Legend />
        <Bar 
          yAxisId="newMembers"
          dataKey="newMembers" 
          fill="#fb923c" 
          name="新規参加"
          radius={[2, 2, 0, 0]}
        />
        <Line 
          yAxisId="memberCount"
          type="monotone" 
          dataKey="memberCount" 
          stroke="#3b82f6" 
          strokeWidth={3}
          name="総メンバー数"
          dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}