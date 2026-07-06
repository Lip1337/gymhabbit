import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { CalendarCheck } from "lucide-react";
import { SETTINGS_COOKIE, parseSettings } from "@/utils/settings";

type SetEntry = {
  gewicht?: number;
  wiederholungen?: number;
};

type SessionExercise = {
  name?: string;
  sets?: SetEntry[];
  // Ältere Einträge (vor der Satz-für-Satz-Erfassung):
  gewicht_geschafft?: number;
  saetze_geschafft?: number;
  wiederholungen_geschafft?: number;
};

function formatDate(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  if (sameDay(date, today)) return "Heute";
  if (sameDay(date, yesterday)) return "Gestern";

  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function TrainingHistory() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const settings = parseSettings(cookieStore.get(SETTINGS_COOKIE)?.value);

  if (!settings.showHistory) {
    return null;
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, plan_name, exercises, completed_at")
    .eq("user", user.id)
    .order("completed_at", { ascending: false })
    .limit(settings.historyLimit);

  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <section className="card flex flex-col gap-3 p-4">
      <p className="text-lg font-bold">Verlauf</p>

      <div className="flex flex-col gap-2">
        {sessions.map((session) => {
          const exercises: SessionExercise[] = Array.isArray(session.exercises)
            ? session.exercises
            : [];
          return (
            <div
              key={session.id}
              className="flex flex-col gap-2.5 rounded-xl border border-line bg-sunken px-3 py-2.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <CalendarCheck size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{session.plan_name}</p>
                  <p className="text-xs text-muted">{exercises.length} Übungen</p>
                </div>
                <p className="text-sm text-muted">
                  {formatDate(session.completed_at)}
                </p>
              </div>

              {exercises.length > 0 && (
                <div className="flex flex-col gap-2 border-t border-line pt-2">
                  {exercises.map((exercise, index) => (
                    <div key={index} className="flex flex-col gap-1 text-xs">
                      <span className="truncate font-medium text-white">
                        {exercise.name ?? `Übung ${index + 1}`}
                      </span>
                      {Array.isArray(exercise.sets) && exercise.sets.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {exercise.sets.map((set, s) => (
                            <span
                              key={s}
                              className="rounded-md bg-surface px-2 py-0.5 text-muted"
                            >
                              {set.gewicht ?? 0} {settings.unit} ×{" "}
                              {set.wiederholungen ?? 0}
                            </span>
                          ))}
                        </div>
                      ) : exercise.saetze_geschafft != null &&
                        exercise.wiederholungen_geschafft != null ? (
                        <span className="text-muted">
                          {exercise.gewicht_geschafft != null
                            ? `${exercise.gewicht_geschafft} ${settings.unit} · `
                            : ""}
                          {exercise.saetze_geschafft} × {exercise.wiederholungen_geschafft}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
