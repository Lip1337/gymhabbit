"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";

type Machine = {
  name: string;
  gewicht: number;
  saetze: number;
  wiederholungen: number;
};

type Plan = {
  id: string;
  name: string;
  data: Machine[];
};

export default function TrainingSession({ plan }: { plan: Plan }) {
  const router = useRouter();
  const [done, setDone] = useState<boolean[]>(plan.data.map(() => false));

  const toggle = (index: number) => {
    const updated = [...done];
    updated[index] = !updated[index];
    setDone(updated);
  };

  const completedCount = done.filter(Boolean).length;
  const total = plan.data.length;
  const allDone = total > 0 && completedCount === total;

  return (
    <div className="flex flex-col p-4 bg-[#141A24] text-white rounded-xl border border-[#2E3A4E] gap-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="border border-[#2E3A4E] rounded-lg p-2 hover:bg-[#1C2432] transition-colors"
          aria-label="Zurück"
        >
          <ArrowLeft size={18} className="text-[#94A3B8]" />
        </button>
        <div>
          <p className="text-lg font-bold">{plan.name}</p>
          <p className="text-sm text-[#94A3B8]">
            {completedCount} von {total} Übungen erledigt
          </p>
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div className="w-full h-2 bg-[#0F1420] rounded-full overflow-hidden">
        <div
          className="h-full bg-[#06B3E3] transition-all duration-300"
          style={{ width: total > 0 ? `${(completedCount / total) * 100}%` : "0%" }}
        />
      </div>

      {/* Übungsliste */}
      <div className="flex flex-col gap-3">
        {plan.data.map((machine, index) => {
          const isDone = done[index];
          return (
            <button
              key={index}
              onClick={() => toggle(index)}
              className={`flex items-center justify-between gap-3 p-4 rounded-xl border transition-colors text-left ${
                isDone
                  ? "bg-[#06B3E3]/10 border-[#06B3E3]"
                  : "bg-[#0F1420] border-[#2E3A4E] hover:border-[#4B5768]"
              }`}
            >
              <div className="flex flex-col gap-1">
                <p className={`font-semibold ${isDone ? "text-[#06B3E3] line-through" : "text-white"}`}>
                  {machine.name}
                </p>
                <p className="text-sm text-[#94A3B8]">
                  {machine.gewicht} kg · {machine.saetze} Sätze · {machine.wiederholungen} Wdh.
                </p>
              </div>

              <div
                className={`shrink-0 w-6 h-6 rounded-full border flex items-center justify-center ${
                  isDone ? "bg-[#06B3E3] border-[#06B3E3]" : "border-[#4B5768]"
                }`}
              >
                {isDone && <Check size={14} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="flex flex-col items-center gap-3 pt-2">
          <p className="text-[#06B3E3] font-semibold">🎉 Training abgeschlossen!</p>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 rounded-lg bg-[#06B3E3] text-white font-semibold hover:opacity-90 transition-opacity"
          >
            Zurück zur Übersicht
          </button>
        </div>
      )}
    </div>
  );
}