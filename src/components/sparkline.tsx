"use client";

import { AreaChart, Area, ResponsiveContainer, YAxis } from "recharts";

interface SparklineProps {
  /** Array of volume values (oldest → newest) */
  data: number[];
  /** Width in px */
  width?: number;
  /** Height in px */
  height?: number;
  /** Stroke / fill colour */
  color?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 28,
  color = "#a855f7",
}: SparklineProps) {
  if (!data || data.length < 2) {
    return (
      <div
        style={{ width, height }}
        className="flex items-center justify-center text-zinc-600 text-[10px]"
      >
        —
      </div>
    );
  }

  const points = data.map((v) => ({ v }));
  const isUp = data[data.length - 1] >= data[0];
  const strokeColor = isUp ? "#22c55e" : "#ef4444";
  const fillColor = isUp ? "#22c55e" : "#ef4444";

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={points} margin={{ top: 2, right: 0, bottom: 2, left: 0 }}>
          <YAxis domain={["dataMin", "dataMax"]} hide />
          <Area
            type="monotone"
            dataKey="v"
            stroke={strokeColor}
            strokeWidth={1.5}
            fill={fillColor}
            fillOpacity={0.15}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
