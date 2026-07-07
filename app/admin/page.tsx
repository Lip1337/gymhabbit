import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, ShieldAlert, Users } from "lucide-react";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient, hasServiceRole } from "@/utils/supabase/admin";
import { SETTINGS_COOKIE, parseSettings } from "@/utils/settings";
import {
  computeStats,
  personalRecords,
  sessionVolume,
  volumeOverTime,
  type WorkoutSession,
} from "@/utils/stats";
import AdminUsers, { type AdminUserRow } from "./AdminUsers";
import AdminExercises from "./AdminExercises";

export const metadata: Metadata = {
  title: "Admin",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 px-4 py-4 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4">
        <div className="card flex items-center gap-3 p-4">
          <Link
            href="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Zurück"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <Users size={18} className="text-accent" />
            <div>
              <p className="text-lg font-bold leading-tight">Admin</p>
              <p className="text-xs text-muted">Alle Nutzer und ihre Statistiken.</p>
            </div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function AdminPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  // Rollen-Check: nur Einträge in der admins-Tabelle dürfen rein.
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!adminRow) {
    redirect("/");
  }

  const { unit } = parseSettings(cookieStore.get(SETTINGS_COOKIE)?.value);

  if (!hasServiceRole()) {
    return (
      <Shell>
        <div className="card flex flex-col items-center gap-3 p-8 text-center">
          <ShieldAlert size={28} className="text-accent" />
          <p className="font-semibold">Service-Role-Key fehlt</p>
          <p className="max-w-md text-sm text-muted">
            Damit die Admin-Seite alle Nutzer laden kann, muss der geheime
            Supabase Service-Role-Key als{" "}
            <code className="rounded bg-sunken px-1">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            in der <code className="rounded bg-sunken px-1">.env</code> gesetzt
            sein (Supabase → Project Settings → API → service_role). Danach den
            Server neu starten.
          </p>
        </div>
      </Shell>
    );
  }

  const admin = createAdminClient();

  const { data: usersData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const users = usersData?.users ?? [];

  const { data: allSessions } = await admin
    .from("workout_sessions")
    .select("id, user, plan_name, exercises, completed_at")
    .order("completed_at", { ascending: false });

  const byUser = new Map<string, WorkoutSession[]>();
  for (const s of (allSessions ?? []) as (WorkoutSession & { user: string })[]) {
    const list = byUser.get(s.user) ?? [];
    list.push(s);
    byUser.set(s.user, list);
  }

  const rows: AdminUserRow[] = users
    .map((u) => {
      const sessions = byUser.get(u.id) ?? [];
      const stats = computeStats(sessions);
      return {
        id: u.id,
        email: u.email ?? "(keine E-Mail)",
        createdAt: u.created_at,
        totalWorkouts: stats.totalWorkouts,
        thisWeek: stats.thisWeek,
        totalVolume: stats.totalVolume,
        dayStreak: stats.dayStreak,
        lastWorkout: sessions[0] ? formatDate(sessions[0].completed_at) : null,
        volume: volumeOverTime(sessions, 14),
        prs: personalRecords(sessions).slice(0, 10),
        recent: sessions.slice(0, 8).map((s) => ({
          id: s.id,
          date: formatDate(s.completed_at),
          plan: s.plan_name,
          exercises: Array.isArray(s.exercises) ? s.exercises.length : 0,
          volume: Math.round(sessionVolume(s)),
        })),
      };
    })
    .sort((a, b) => b.totalWorkouts - a.totalWorkouts);

  return (
    <Shell>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card flex flex-col gap-1 p-4">
          <p className="text-2xl font-bold leading-none">{rows.length}</p>
          <p className="text-xs text-muted">Nutzer</p>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <p className="text-2xl font-bold leading-none">
            {rows.reduce((sum, r) => sum + r.totalWorkouts, 0)}
          </p>
          <p className="text-xs text-muted">Trainings gesamt</p>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <p className="text-2xl font-bold leading-none">
            {rows.filter((r) => r.thisWeek > 0).length}
          </p>
          <p className="text-xs text-muted">Aktiv diese Woche</p>
        </div>
        <div className="card flex flex-col gap-1 p-4">
          <p className="text-2xl font-bold leading-none">
            {rows.filter((r) => r.totalWorkouts === 0).length}
          </p>
          <p className="text-xs text-muted">Ohne Training</p>
        </div>
      </div>

      <AdminExercises />

      <AdminUsers rows={rows} unit={unit} />
    </Shell>
  );
}
