import Link from "next/link";
import { cookies } from "next/headers";
import { Users } from "lucide-react";

import { createClient } from "@/utils/supabase/server";
import { SETTINGS_COOKIE, parseSettings } from "@/utils/settings";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  training_since: string | null;
};

function label(p: Profile): string {
  return p.display_name || p.username || "Freund";
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "gerade eben";
  if (min < 60) return `vor ${min} Min.`;
  const hours = Math.round(min / 60);
  if (hours < 24) return `vor ${hours} Std.`;
  const days = Math.round(hours / 24);
  return `vor ${days} Tag${days === 1 ? "" : "en"}`;
}

// Als "trainiert gerade" gilt, wer in den letzten 3 Stunden gestartet ist.
function isTrainingNow(iso: string | null): boolean {
  if (!iso) return false;
  return Date.now() - new Date(iso).getTime() < 3 * 60 * 60 * 1000;
}

export default async function FriendsActivity() {
  const cookieStore = await cookies();
  const settings = parseSettings(cookieStore.get(SETTINGS_COOKIE)?.value);
  if (!settings.showFriends) return null;

  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rels } = await supabase
    .from("friendships")
    .select("requester, addressee")
    .eq("status", "accepted");

  const friendIds = (rels ?? []).map((r) =>
    r.requester === user.id ? r.addressee : r.requester,
  );

  if (friendIds.length === 0) {
    return (
      <section className="card flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Users size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Freunde</p>
          <p className="text-xs text-muted">
            Füge Freunde hinzu und sieh, wer gerade trainiert.
          </p>
        </div>
        <Link href="/friends" className="btn-primary px-3 py-1.5 text-sm">
          Hinzufügen
        </Link>
      </section>
    );
  }

  const { data: profs } = await supabase
    .from("profiles")
    .select("id, username, display_name, training_since")
    .in("id", friendIds);

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("user, plan_name, completed_at")
    .in("user", friendIds)
    .order("completed_at", { ascending: false })
    .limit(60);

  const lastByUser = new Map<string, { plan_name: string; completed_at: string }>();
  for (const s of sessions ?? []) {
    if (!lastByUser.has(s.user)) {
      lastByUser.set(s.user, {
        plan_name: s.plan_name,
        completed_at: s.completed_at,
      });
    }
  }

  const profiles = (profs as Profile[]) ?? [];
  const rows = profiles
    .map((p) => ({
      profile: p,
      training: isTrainingNow(p.training_since),
      last: lastByUser.get(p.id) ?? null,
    }))
    .sort((a, b) => {
      if (a.training !== b.training) return a.training ? -1 : 1;
      const at = a.last ? new Date(a.last.completed_at).getTime() : 0;
      const bt = b.last ? new Date(b.last.completed_at).getTime() : 0;
      return bt - at;
    });

  return (
    <section className="card flex flex-col gap-3 p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">Freunde</p>
        <Link href="/friends" className="text-sm font-semibold text-accent">
          Verwalten
        </Link>
      </div>

      <div className="flex flex-col gap-2">
        {rows.map(({ profile, training, last }) => (
          <div
            key={profile.id}
            className="flex items-center gap-3 rounded-xl border border-line bg-sunken px-3 py-2.5"
          >
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Users size={16} />
              {training && (
                <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-surface bg-green-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{label(profile)}</p>
              {training ? (
                <p className="text-xs font-medium text-green-400">
                  Trainiert gerade
                </p>
              ) : last ? (
                <p className="truncate text-xs text-muted">
                  {last.plan_name} · {relativeTime(last.completed_at)}
                </p>
              ) : (
                <p className="text-xs text-muted">Noch kein Training</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
