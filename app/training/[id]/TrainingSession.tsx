"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Plus, Trophy, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSettings } from "@/utils/useSettings";

type SetEntry = {
  gewicht: number;
  wiederholungen: number;
};

type Machine = {
  name: string;
  gewicht: number;
  saetze: number;
  wiederholungen: number;
  sets?: SetEntry[];
};

type Plan = {
  id: string;
  name: string;
  data: Machine[];
};

type Progress = {
  done: boolean;
  sets: SetEntry[];
};

export default function TrainingSession({ plan }: { plan: Plan }) {
  const router = useRouter();
  const supabase = createClient();
  const { settings } = useSettings();
  const [progress, setProgress] = useState<Progress[]>(
    plan.data.map((machine) => ({
      done: false,
      // Zuletzt gespeicherte Pro-Satz-Werte übernehmen, sonst aus den Zielwerten erzeugen.
      sets:
        machine.sets && machine.sets.length > 0
          ? machine.sets.map((set) => ({
              gewicht: set.gewicht,
              wiederholungen: set.wiederholungen,
            }))
          : Array.from({ length: Math.max(1, machine.saetze) }, () => ({
              gewicht: machine.gewicht,
              wiederholungen: machine.wiederholungen,
            })),
    })),
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Stabile ID für diese Trainingseinheit, damit erneutes Speichern die Session aktualisiert.
  const sessionIdRef = useRef<string>(crypto.randomUUID());

  const updateSet = (
    exerciseIndex: number,
    setIndex: number,
    field: "gewicht" | "wiederholungen",
    value: number,
  ) => {
    setProgress((prev) =>
      prev.map((item, i) =>
        i === exerciseIndex
          ? {
              ...item,
              sets: item.sets.map((set, s) =>
                s === setIndex ? { ...set, [field]: Math.max(0, value) } : set,
              ),
            }
          : item,
      ),
    );
  };

  const addSet = (exerciseIndex: number) => {
    setProgress((prev) =>
      prev.map((item, i) => {
        if (i !== exerciseIndex) return item;
        const last = item.sets[item.sets.length - 1];
        return {
          ...item,
          sets: [...item.sets, last ? { ...last } : { gewicht: 0, wiederholungen: 0 }],
        };
      }),
    );
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    setProgress((prev) =>
      prev.map((item, i) =>
        i === exerciseIndex && item.sets.length > 1
          ? { ...item, sets: item.sets.filter((_, s) => s !== setIndex) }
          : item,
      ),
    );
  };

  const toggle = (index: number) => {
    setProgress((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, done: !item.done } : item,
      ),
    );
  };

  const saveSession = async (finalProgress: Progress[], goHome = false) => {
    if (saving) return;
    setSaving(true);
    setErrorMsg(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSaving(false);
      setErrorMsg("Nicht angemeldet – bitte neu einloggen.");
      return;
    }

    const exercises = plan.data.map((machine, index) => ({
      ...machine,
      done: finalProgress[index].done,
      sets: finalProgress[index].sets,
      saetze_geschafft: finalProgress[index].sets.length,
    }));

    // Insert oder Update in einem: gleiche id => bestehende Session wird aktualisiert.
    const { error } = await supabase.from("workout_sessions").upsert({
      id: sessionIdRef.current,
      user: user.id,
      plan_id: plan.id,
      plan_name: plan.name,
      exercises,
    });

    if (error) {
      setSaving(false);
      setErrorMsg(error.message);
      return;
    }

    // Geschaffte Werte pro Satz in den Trainingsplan übernehmen. Einzelwerte
    // (gewicht/wiederholungen) auf den ersten Satz syncen, damit Zusammenfassungen
    // weiter funktionieren.
    const updatedPlanData = plan.data.map((machine, index) => {
      const sets = finalProgress[index].sets;
      return {
        ...machine,
        sets,
        saetze: sets.length,
        gewicht: sets[0].gewicht,
        wiederholungen: sets[0].wiederholungen,
      };
    });

    const { error: planError } = await supabase
      .from("plans")
      .update({ data: updatedPlanData })
      .eq("id", plan.id)
      .eq("user", user.id);

    setSaving(false);

    if (planError) {
      setErrorMsg(planError.message);
      return;
    }

    setSaved(true);
    if (goHome) {
      router.push("/");
      router.refresh();
    }
  };

  const completedCount = progress.filter((item) => item.done).length;
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
          const item = progress[index];
          const isDone = item.done;
          return (
            <div
              key={index}
              className={`flex flex-col gap-3 rounded-2xl border p-4 transition-colors ${
                isDone ? "border-accent bg-accent/10" : "border-line bg-surface"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <p
                    className={`truncate font-semibold ${
                      isDone ? "text-accent" : "text-white"
                    }`}
                  >
                    {machine.name}
                  </p>
                  <div className="flex flex-wrap gap-1.5 text-xs font-medium text-muted">
                    <span className="rounded-md bg-sunken px-2 py-0.5">
                      Ziel: {machine.gewicht} {settings.unit} · {machine.saetze} ×{" "}
                      {machine.wiederholungen}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggle(index)}
                  aria-label={isDone ? "Als offen markieren" : "Als erledigt markieren"}
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    isDone
                      ? "border-accent bg-accent"
                      : "border-faint hover:border-accent"
                  }`}
                >
                  {isDone && <Check size={15} className="text-white" />}
                </button>
              </div>

              {/* Sätze */}
              <div className="flex flex-col gap-2">
                {/* Spaltenüberschriften */}
                <div className="flex items-center gap-2 px-1 text-xs font-medium text-muted">
                  <span className="w-10 shrink-0">Satz</span>
                  <span className="flex-1 text-center">
                    Gewicht ({settings.unit})
                  </span>
                  <span className="flex-1 text-center">Wdh.</span>
                  <span className="w-7 shrink-0" />
                </div>

                {item.sets.map((set, setIndex) => (
                  <div key={setIndex} className="flex items-center gap-2">
                    <span className="flex h-9 w-10 shrink-0 items-center justify-center rounded-lg bg-sunken text-sm font-semibold text-muted">
                      {setIndex + 1}
                    </span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      value={set.gewicht || ""}
                      placeholder="0"
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        updateSet(
                          index,
                          setIndex,
                          "gewicht",
                          parseFloat(e.target.value) || 0,
                        )
                      }
                      className="h-9 w-full flex-1 rounded-xl border border-line bg-sunken px-3 text-center text-sm font-semibold text-white outline-none transition-colors placeholder:text-faint focus:border-accent"
                    />
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={set.wiederholungen || ""}
                      placeholder="0"
                      onFocus={(e) => e.currentTarget.select()}
                      onChange={(e) =>
                        updateSet(
                          index,
                          setIndex,
                          "wiederholungen",
                          parseInt(e.target.value) || 0,
                        )
                      }
                      className="h-9 w-full flex-1 rounded-xl border border-line bg-sunken px-3 text-center text-sm font-semibold text-white outline-none transition-colors placeholder:text-faint focus:border-accent"
                    />
                    <button
                      onClick={() => removeSet(index, setIndex)}
                      disabled={item.sets.length <= 1}
                      aria-label="Satz entfernen"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addSet(index)}
                  className="flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-line py-2 text-xs font-medium text-muted transition-colors hover:border-accent hover:text-accent"
                >
                  <Plus size={14} />
                  Satz hinzufügen
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {allDone && (
        <div className="card flex flex-col items-center gap-2 border-accent/40 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <Trophy size={24} />
          </div>
          <p className="font-semibold text-accent">Alle Übungen erledigt!</p>
        </div>
      )}

      {/* Speichern */}
      <div className="mt-auto flex flex-col gap-2">
        {errorMsg && (
          <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-center text-xs text-red-400">
            Speichern fehlgeschlagen: {errorMsg}
          </p>
        )}
        <p className="text-center text-xs text-muted">
          {saving
            ? "Wird gespeichert…"
            : saved
              ? "Im Verlauf gespeichert – Änderungen werden übernommen"
              : "Trage dein Gewicht und deine Wiederholungen pro Satz ein"}
        </p>
        <button
          onClick={() => saveSession(progress, true)}
          disabled={saving}
          className="btn-primary disabled:opacity-60"
        >
          {saved ? "Speichern & beenden" : "Training beenden & speichern"}
        </button>
      </div>
    </div>
  );
}
