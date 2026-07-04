"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Trophy } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

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
  const supabase = createClient();
  const [done, setDone] = useState<boolean[]>(plan.data.map(() => false));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const toggle = (index: number) => {
    const updated = [...done];
    updated[index] = !updated[index];
    setDone(updated);

    const total = plan.data.length;
    const completedCount = updated.filter(Boolean).length;
    if (total > 0 && completedCount === total) {
      saveSession(updated);
    }
  };

  const saveSession = async (finalDone: boolean[]) => {
    if (saved || saving) return;
    setSaving(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      return;
    }

    const { error } = await supabase.from("workout_sessions").insert({
      user: user.id,
      plan_id: plan.id,
      plan_name: plan.name,
      exercises: plan.data.map((machine, index) => ({
        ...machine,
        done: finalDone[index],
      })),
    });

    setSaving(false);
    if (!error) {
      setSaved(true);
    }
  };

  const completedCount = done.filter(Boolean).length;
  const total = plan.data.length;
  const allDone = total > 0 && completedCount === total;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="card flex flex-col gap-4 p-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Zurück"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-bold">{plan.name}</p>
            <p className="text-sm text-muted">
              {completedCount} von {total} Übungen erledigt
            </p>
          </div>
          <span className="text-sm font-semibold text-accent">{percent}%</span>
        </div>

        {/* Fortschrittsbalken */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-sunken">
          <div
            className="h-full rounded-full bg-accent transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {/* Übungsliste */}
      <div className="flex flex-col gap-3">
        {plan.data.map((machine, index) => {
          const isDone = done[index];
          return (
            <button
              key={index}
              onClick={() => toggle(index)}
              className={`flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-colors ${
                isDone
                  ? "border-accent bg-accent/10"
                  : "border-line bg-surface hover:border-faint"
              }`}
            >
              <div className="flex min-w-0 flex-col gap-1.5">
                <p
                  className={`truncate font-semibold ${
                    isDone ? "text-accent line-through" : "text-white"
                  }`}
                >
                  {machine.name}
                </p>
                <div className="flex flex-wrap gap-1.5 text-xs font-medium text-muted">
                  <span className="rounded-md bg-sunken px-2 py-0.5">
                    {machine.gewicht} kg
                  </span>
                  <span className="rounded-md bg-sunken px-2 py-0.5">
                    {machine.saetze} Sätze
                  </span>
                  <span className="rounded-md bg-sunken px-2 py-0.5">
                    {machine.wiederholungen} Wdh.
                  </span>
                </div>
              </div>

              <div
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                  isDone ? "border-accent bg-accent" : "border-faint"
                }`}
              >
                {isDone && <Check size={15} className="text-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {allDone && (
        <div className="card flex flex-col items-center gap-3 border-accent/40 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Trophy size={24} />
          </div>
          <p className="font-semibold text-accent">Training abgeschlossen!</p>
          <p className="text-sm text-muted">
            {saving ? "Wird gespeichert…" : saved ? "Im Verlauf gespeichert" : ""}
          </p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Zurück zur Übersicht
          </button>
        </div>
      )}
    </div>
  );
}
