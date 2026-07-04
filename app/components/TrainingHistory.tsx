import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { CalendarCheck } from "lucide-react";

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
    .limit(5);

  if (!sessions || sessions.length === 0) {
    return null;
  }

  return (
    <section className="card flex flex-col gap-3 p-4">
      <p className="text-lg font-bold">Verlauf</p>

      <div className="flex flex-col gap-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-sunken px-3 py-2.5"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <CalendarCheck size={16} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{session.plan_name}</p>
              <p className="text-xs text-muted">
                {Array.isArray(session.exercises)
                  ? `${session.exercises.length} Übungen`
                  : ""}
              </p>
            </div>
            <p className="text-sm text-muted">{formatDate(session.completed_at)}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
