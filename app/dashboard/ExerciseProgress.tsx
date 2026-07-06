"use client";

import { useState } from "react";
import { LineChart } from "./charts";
import type { VolumePoint } from "@/utils/stats";

export default function ExerciseProgress({
  names,
  progress,
  unit,
}: {
  names: string[];
  progress: Record<string, VolumePoint[]>;
  unit: string;
}) {
  const [selected, setSelected] = useState(names[0] ?? "");

  if (names.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted">
        Noch keine Übungen erfasst.
      </p>
    );
  }

  const data = progress[selected] ?? [];
  const best = data.reduce((m, p) => Math.max(m, p.value), 0);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="input max-w-xs"
        >
          {names.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
        <span className="text-sm text-muted">
          Bestwert:{" "}
          <span className="font-semibold text-accent">
            {best} {unit}
          </span>
        </span>
      </div>
      <div className="-mx-1 overflow-x-auto px-1">
        <div className="min-w-[520px] lg:min-w-0">
          <LineChart data={data} />
        </div>
      </div>
    </div>
  );
}
