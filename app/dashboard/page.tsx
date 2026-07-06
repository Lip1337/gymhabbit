import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  Dumbbell,
  Flame,
  Trophy,
  Weight,
} from "lucide-react";

import { createClient } from "@/utils/supabase/server";
import { SETTINGS_COOKIE, parseSettings } from "@/utils/settings";
import {
  computeStats,
  exerciseProgress,
  loggedExerciseNames,
  muscleDistribution,
  personalRecords,
  sessionVolume,
  volumeOverTime,
  workoutsByWeekday,
  type VolumePoint,
  type WorkoutSession,
} from "@/utils/stats";
import { BarChart, HBars } from "./charts";
import ExerciseProgress from "./ExerciseProgress";

export const metadata: Metadata = {
  title: "Dashboard",
};

function fmt(n: number): string {
  return n.toLocaleString("de-DE");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  const { unit } = parseSettings(cookieStore.get(SETTINGS_COOKIE)?.value);

  const { data } = await supabase
    .from("workout_sessions")
    .select("id, plan_name, exercises, completed_at")
    .eq("user", user.id)
    .order("completed_at", { ascending: false })
    .limit(500);

  const sessions = (data ?? []) as WorkoutSession[];

  const stats = computeStats(sessions);
  const volume = volumeOverTime(sessions, 14);
  const weekday = workoutsByWeekday(sessions);
  const muscles = muscleDistribution(sessions);
  const prs = personalRecords(sessions);
  const names = loggedExerciseNames(sessions);
  const progress: Record<string, VolumePoint[]> = {};
  for (const name of names) progress[name] = exerciseProgress(sessions, name);

  const kpis = [
    { icon: Dumbbell, label: "Trainings gesamt", value: fmt(stats.totalWorkouts) },
    { icon: CalendarDays, label: "Diese Woche", value: fmt(stats.thisWeek) },
    { icon: Flame, label: "Streak (Tage)", value: fmt(stats.dayStreak) },
    { icon: Weight, label: `Volumen (${unit})`, value: fmt(stats.totalVolume) },
    { icon: Activity, label: "Sätze gesamt", value: fmt(stats.totalSets) },
    { icon: Trophy, label: "Rekorde", value: fmt(stats.prCount) },
  ];

  return (
    <div className="w-full px-4 py-4 lg:relative lg:left-1/2 lg:w-screen lg:max-w-[100vw] lg:-translate-x-1/2 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        {/* Header */}
        <div className="card flex items-center gap-3 p-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Zurück"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1">
            <p className="text-lg font-bold leading-tight">Dashboard</p>
            <p className="text-xs text-muted">
              Deine Trainingsstatistiken auf einen Blick.
            </p>
          </div>
        </div>

        {sessions.length === 0 ? (
          <div className="card flex flex-col items-center gap-3 p-10 text-center">
            <Dumbbell size={28} className="text-accent" />
            <p className="font-semibold">Noch keine Trainingsdaten</p>
            <p className="text-sm text-muted">
              Schließe dein erstes Training ab – danach erscheinen hier deine
              Statistiken.
            </p>
            <Link href="/" className="btn-primary mt-1">
              Zum Training
            </Link>
          </div>
        ) : (
          <>
            {/* KPI-Kacheln */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
              {kpis.map((kpi) => (
                <div key={kpi.label} className="card flex flex-col gap-2 p-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <kpi.icon size={18} />
                  </div>
                  <p className="text-2xl font-bold leading-none">{kpi.value}</p>
                  <p className="text-xs text-muted">{kpi.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="card flex flex-col gap-3 p-4 lg:col-span-2">
                <p className="font-bold">Volumen pro Training ({unit})</p>
                <div className="-mx-1 overflow-x-auto px-1">
                  <div className="min-w-[520px] lg:min-w-0">
                    <BarChart data={volume} />
                  </div>
                </div>
              </section>

              <section className="card flex flex-col gap-3 p-4">
                <p className="font-bold">Trainings pro Wochentag</p>
                <BarChart data={weekday} />
              </section>

              <section className="card flex flex-col gap-3 p-4">
                <p className="font-bold">Sätze pro Muskelgruppe</p>
                <HBars data={muscles} />
              </section>

              <section className="card flex flex-col gap-3 p-4 lg:col-span-2">
                <p className="font-bold">Fortschritt pro Übung (max. {unit})</p>
                <ExerciseProgress names={names} progress={progress} unit={unit} />
              </section>
            </div>

            {/* Tabellen */}
            <div className="grid gap-4 lg:grid-cols-2">
              <section className="card flex flex-col gap-3 p-4">
                <p className="font-bold">Bestleistungen</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted">
                        <th className="pb-2 font-medium">Übung</th>
                        <th className="pb-2 text-right font-medium">Max ({unit})</th>
                        <th className="pb-2 text-right font-medium">Wdh.</th>
                        <th className="hidden pb-2 text-right font-medium sm:table-cell">
                          Beste Wdh.
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {prs.slice(0, 12).map((pr) => (
                        <tr key={pr.name} className="border-t border-line">
                          <td className="max-w-[10rem] truncate py-2 pr-2 font-medium">
                            {pr.name}
                          </td>
                          <td className="py-2 text-right font-semibold text-accent">
                            {fmt(pr.maxWeight)}
                          </td>
                          <td className="py-2 text-right text-muted">
                            {pr.repsAtMaxWeight}
                          </td>
                          <td className="hidden py-2 text-right text-muted sm:table-cell">
                            {pr.maxReps}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="card flex flex-col gap-3 p-4">
                <p className="font-bold">Letzte Trainings</p>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted">
                        <th className="pb-2 font-medium">Datum</th>
                        <th className="pb-2 font-medium">Plan</th>
                        <th className="hidden pb-2 text-right font-medium sm:table-cell">
                          Übungen
                        </th>
                        <th className="pb-2 text-right font-medium">Volumen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sessions.slice(0, 10).map((s) => (
                        <tr key={s.id} className="border-t border-line">
                          <td className="py-2 pr-2 text-muted">
                            {formatDate(s.completed_at)}
                          </td>
                          <td className="max-w-[9rem] truncate py-2 pr-2 font-medium">
                            {s.plan_name}
                          </td>
                          <td className="hidden py-2 text-right text-muted sm:table-cell">
                            {Array.isArray(s.exercises) ? s.exercises.length : 0}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {fmt(Math.round(sessionVolume(s)))} {unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
