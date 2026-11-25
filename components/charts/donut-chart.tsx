"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

export default function DonutChart({ data, ariaLabel }: { data: { label: string; value: number; color: string }[]; ariaLabel: string }) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row">
      <div role="img" aria-label={ariaLabel} className="relative h-48 w-48 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="label" innerRadius={55} outerRadius={88} paddingAngle={2} isAnimationActive={false}>
              {data.map((d) => (
                <Cell key={d.label} fill={d.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ borderRadius: 12, fontSize: 15 }} />
          </PieChart>
        </ResponsiveContainer>
        <span className="absolute inset-0 grid place-items-center font-heading text-3xl font-bold" aria-hidden>
          {total}
        </span>
      </div>
      {/* Legend doubles as the accessible data table */}
      <ul className="grid gap-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-2">
            <span className="size-4 rounded" style={{ background: d.color }} aria-hidden />
            <span>{d.label}</span>
            <span className="font-semibold">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
