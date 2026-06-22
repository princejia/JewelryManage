"use client";

import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface StatusDatum {
  name: string;
  value: number;
  key: string;
}

const COLORS: Record<string, string> = {
  in_stock: "#16a34a",
  sold: "#9ca3af",
  consignment: "#eab308",
};

export function StatusPieChart({ data }: { data: StatusDatum[] }) {
  const hasData = data.some((d) => d.value > 0);

  if (!hasData) {
    return (
      <div className="flex h-[260px] items-center justify-center text-sm text-gray-400">
        暂无数据
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          label={(entry) => `${entry.name}: ${entry.value}`}
        >
          {data.map((entry) => (
            <Cell key={entry.key} fill={COLORS[entry.key] ?? "#d1d5db"} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}
