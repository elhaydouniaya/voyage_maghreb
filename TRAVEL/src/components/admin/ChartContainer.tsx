"use client";

import { useEffect, useState, type ReactNode } from "react";

type Props = {
  heightClass?: string;
  children: ReactNode;
};

/** Avoid Recharts width/height -1 when parent layout is not ready yet. */
export default function ChartContainer({
  heightClass = "h-64",
  children,
}: Props) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className={`w-full min-w-0 ${heightClass}`}>
      {ready ? children : <div className="h-full w-full animate-pulse rounded-2xl bg-gray-50" />}
    </div>
  );
}
