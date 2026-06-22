"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface ProfitDatum {
  date: string;
  profit: number;
  revenue: number;
}

export function ProfitChart({ data }: { data: ProfitDatum[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" fontSize={12} stroke="#9ca3af" />
        <YAxis fontSize={12} stroke="#9ca3af" />
        <Tooltip
          formatter={(value: number, name: string) => [
            `¥${value.toLocaleString()}`,
            name === "revenue" ? "销售额" : "利润",
          ]}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          name="revenue"
          stroke="#b45309"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="profit"
          name="profit"
          stroke="#16a34a"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
