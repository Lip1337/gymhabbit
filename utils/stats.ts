// Reine Auswertungs-Helfer für das Dashboard. Kein React, server- wie clientseitig nutzbar.

import { CURATED_EXERCISES } from "@/app/data/exercises";

export type LoggedSet = { gewicht: number; wiederholungen: number };

export type RawExercise = {
  name?: string;
  sets?: { gewicht?: number; wiederholungen?: number }[];
  // Älteres Format vor der Satz-für-Satz-Erfassung:
  gewicht_geschafft?: number;
  saetze_geschafft?: number;
  wiederholungen_geschafft?: number;
};

export type WorkoutSession = {
  id: string;
  plan_name: string;
  exercises: RawExercise[] | null;
  completed_at: string;
};

const GROUP_BY_NAME = new Map(
  CURATED_EXERCISES.map((e) => [e.name.toLowerCase(), e.group as string]),
);

export function groupForExercise(name: string): string {
  return GROUP_BY_NAME.get(name.trim().toLowerCase()) ?? "Sonstige";
}

/** Sätze einer Übung – behandelt neues (sets[]) und altes Format. */
export function exerciseSets(ex: RawExercise): LoggedSet[] {
  if (Array.isArray(ex.sets) && ex.sets.length > 0) {
    return ex.sets.map((s) => ({
      gewicht: Number(s.gewicht) || 0,
      wiederholungen: Number(s.wiederholungen) || 0,
    }));
  }
  const count = Number(ex.saetze_geschafft) || 0;
  const g = Number(ex.gewicht_geschafft) || 0;
  const r = Number(ex.wiederholungen_geschafft) || 0;
  if (count > 0) {
    return Array.from({ length: count }, () => ({ gewicht: g, wiederholungen: r }));
  }
  return [];
}

function sessionExercises(session: WorkoutSession): RawExercise[] {
  return Array.isArray(session.exercises) ? session.exercises : [];
}

export function sessionVolume(session: WorkoutSession): number {
  let volume = 0;
  for (const ex of sessionExercises(session)) {
    for (const set of exerciseSets(ex)) {
      volume += set.gewicht * set.wiederholungen;
    }
  }
  return volume;
}

function dateKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function startOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // Montag = 0
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date;
}

export type DashboardStats = {
  totalWorkouts: number;
  thisWeek: number;
  thisMonth: number;
  totalVolume: number;
  totalSets: number;
  totalReps: number;
  avgVolume: number;
  dayStreak: number;
  prCount: number;
};

export function computeStats(sessions: WorkoutSession[]): DashboardStats {
  const now = new Date();
  const weekStart = startOfWeek(now);
  let totalVolume = 0;
  let totalSets = 0;
  let totalReps = 0;
  let thisWeek = 0;
  let thisMonth = 0;

  for (const s of sessions) {
    const when = new Date(s.completed_at);
    if (when >= weekStart) thisWeek++;
    if (
      when.getFullYear() === now.getFullYear() &&
      when.getMonth() === now.getMonth()
    ) {
      thisMonth++;
    }
    for (const ex of sessionExercises(s)) {
      for (const set of exerciseSets(ex)) {
        totalSets++;
        totalReps += set.wiederholungen;
        totalVolume += set.gewicht * set.wiederholungen;
      }
    }
  }

  // Tages-Streak: aufeinanderfolgende Trainingstage bis heute/gestern.
  const days = new Set(sessions.map((s) => dateKey(s.completed_at)));
  let dayStreak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (!days.has(keyOf(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (days.has(keyOf(cursor))) {
    dayStreak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return {
    totalWorkouts: sessions.length,
    thisWeek,
    thisMonth,
    totalVolume,
    totalSets,
    totalReps,
    avgVolume: sessions.length ? Math.round(totalVolume / sessions.length) : 0,
    dayStreak,
    prCount: personalRecords(sessions).length,
  };
}

export type VolumePoint = { label: string; value: number };

/** Volumen je Training, chronologisch (älteste zuerst). */
export function volumeOverTime(
  sessions: WorkoutSession[],
  limit = 14,
): VolumePoint[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
  );
  const recent = sorted.slice(-limit);
  return recent.map((s) => {
    const d = new Date(s.completed_at);
    return {
      label: `${d.getDate()}.${d.getMonth() + 1}.`,
      value: Math.round(sessionVolume(s)),
    };
  });
}

/** Trainings pro Wochentag (Mo–So). */
export function workoutsByWeekday(sessions: WorkoutSession[]): VolumePoint[] {
  const labels = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
  const counts = new Array(7).fill(0);
  for (const s of sessions) {
    const day = (new Date(s.completed_at).getDay() + 6) % 7;
    counts[day]++;
  }
  return labels.map((label, i) => ({ label, value: counts[i] }));
}

/** Anzahl Sätze je Muskelgruppe. */
export function muscleDistribution(sessions: WorkoutSession[]): VolumePoint[] {
  const map = new Map<string, number>();
  for (const s of sessions) {
    for (const ex of sessionExercises(s)) {
      if (!ex.name) continue;
      const group = groupForExercise(ex.name);
      map.set(group, (map.get(group) ?? 0) + exerciseSets(ex).length);
    }
  }
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);
}

export type PersonalRecord = {
  name: string;
  maxWeight: number;
  repsAtMaxWeight: number;
  maxReps: number;
};

export function personalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const map = new Map<string, PersonalRecord>();
  for (const s of sessions) {
    for (const ex of sessionExercises(s)) {
      if (!ex.name) continue;
      const rec =
        map.get(ex.name) ??
        { name: ex.name, maxWeight: 0, repsAtMaxWeight: 0, maxReps: 0 };
      for (const set of exerciseSets(ex)) {
        if (set.gewicht > rec.maxWeight) {
          rec.maxWeight = set.gewicht;
          rec.repsAtMaxWeight = set.wiederholungen;
        }
        if (set.wiederholungen > rec.maxReps) rec.maxReps = set.wiederholungen;
      }
      map.set(ex.name, rec);
    }
  }
  return [...map.values()].sort((a, b) => b.maxWeight - a.maxWeight);
}

/** Namen aller je geloggten Übungen (alphabetisch). */
export function loggedExerciseNames(sessions: WorkoutSession[]): string[] {
  const set = new Set<string>();
  for (const s of sessions) {
    for (const ex of sessionExercises(s)) {
      if (ex.name) set.add(ex.name);
    }
  }
  return [...set].sort((a, b) => a.localeCompare(b, "de"));
}

/** Max-Gewicht einer bestimmten Übung je Training, chronologisch. */
export function exerciseProgress(
  sessions: WorkoutSession[],
  name: string,
): VolumePoint[] {
  const sorted = [...sessions].sort(
    (a, b) =>
      new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime(),
  );
  const points: VolumePoint[] = [];
  for (const s of sorted) {
    let max = 0;
    let found = false;
    for (const ex of sessionExercises(s)) {
      if (ex.name !== name) continue;
      found = true;
      for (const set of exerciseSets(ex)) {
        if (set.gewicht > max) max = set.gewicht;
      }
    }
    if (found) {
      const d = new Date(s.completed_at);
      points.push({ label: `${d.getDate()}.${d.getMonth() + 1}.`, value: max });
    }
  }
  return points;
}
