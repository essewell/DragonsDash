"use client";

import { useMemo } from "react";
import clsx from "clsx";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "#CC5500",
  className,
}: SparklineProps) {
  const path = useMemo(() => {
    if (data.length < 2) return "";

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const points = data.map((value, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((value - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    });

    return `M${points.join("L")}`;
  }, [data, width, height]);

  if (data.length < 2) {
    return (
      <span
        className={clsx("inline-block text-xs text-warm-400", className)}
        style={{ width, height }}
      >
        —
      </span>
    );
  }

  const trend =
    data[data.length - 1] >= data[0] ? color : "#DC2626";

  return (
    <svg
      className={clsx("inline-block", className)}
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
    >
      <path
        d={path}
        stroke={trend}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}
