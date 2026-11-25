"use client";

import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export default function ProgressLineChart({
  points,
  ariaLabel,
  color = "#2563EB",
  height = 220,
}: {
  points: { label: string; value: number; note?: string }[];
  ariaLabel: string;
  color?: string;
  height?: number;
}) {
  return (
    <div role="img" aria-label={ariaLabel} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#E2E8F0" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "#475569", fontSize: 14 }} tickLine={false} axisLine={false} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={{ fill: "#475569", fontSize: 14 }} tickLine={false} axisLine={false} />
          <ReferenceLine y={80} stroke="#0F766E" strokeDasharray="4 4" />
          <Tooltip
            contentStyle={{ borderRadius: 12, fontSize: 15 }}
            formatter={(v) => [`${v}%`, ""]}
            labelFormatter={(l, p) => {
              const note = (p?.[0]?.payload as { note?: string } | undefined)?.note;
              return note ? `${l} – ${note}` : String(l);
            }}
          />
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ r: 5, fill: color }} activeDot={{ r: 7 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
