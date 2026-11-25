"use client";

import { Bar, BarChart, CartesianGrid, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CHART_COLORS } from "./palette";

/** Horizontal bar chart with value labels (readable on narrow screens). */
export default function BarListChart({
  data,
  valueSuffix = "",
  max,
  ariaLabel,
}: {
  data: { label: string; value: number }[];
  valueSuffix?: string;
  max?: number;
  ariaLabel: string;
}) {
  const height = Math.max(160, data.length * 44 + 20);
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 48, bottom: 4, left: 4 }}>
          <CartesianGrid horizontal={false} stroke="#E2E8F0" />
          <XAxis type="number" hide domain={[0, max ?? "dataMax"]} />
          <YAxis type="category" dataKey="label" width={150} tick={{ fill: "#1E293B", fontSize: 15 }} axisLine={false} tickLine={false} />
          <Tooltip cursor={{ fill: "#F1F5F9" }} formatter={(v) => `${v}${valueSuffix}`} contentStyle={{ borderRadius: 12, fontSize: 15 }} />
          <Bar dataKey="value" radius={[0, 8, 8, 0]} isAnimationActive={false} barSize={24}>
            {data.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v: unknown) => `${v}${valueSuffix}`} style={{ fill: "#1E293B", fontSize: 15, fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
