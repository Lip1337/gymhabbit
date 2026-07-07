"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Check,
  Search,
  UserPlus,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type Friendship = {
  id: string;
  requester: string;
  addressee: string;
  status: string;
};

type Relation = { friendshipId: string; profile: Profile };

function label(p: Profile): string {
  return p.display_name || p.username || "Unbekannt";
}

export default function FriendsClient() {
  const supabase = createClient();
  const router = useRouter();

  const [me, setMe] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [savedUsername, setSavedUsername] = useState<string | null>(null);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);

  const [friends, setFriends] = useState<Relation[]>([]);
  const [incoming, setIncoming] = useState<Relation[]>([]);
  const [outgoing, setOutgoing] = useState<Relation[]>([]);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    setMe(user.id);

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .eq("id", user.id)
      .maybeSingle();
    if (myProfile) {
      setSavedUsername(myProfile.username ?? null);
      setUsername(myProfile.username ?? "");
    }

    const { data: rels } = await supabase
      .from("friendships")
      .select("id, requester, addressee, status");
    const rows = (rels as Friendship[]) ?? [];

    const otherIds = new Set<string>();
    for (const r of rows) {
      otherIds.add(r.requester === user.id ? r.addressee : r.requester);
    }
    const profileMap = new Map<string, Profile>();
    if (otherIds.size > 0) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", [...otherIds]);
      for (const p of (profs as Profile[]) ?? []) profileMap.set(p.id, p);
    }
    const profOf = (id: string): Profile =>
      profileMap.get(id) ?? { id, username: null, display_name: null };

    setFriends(
      rows
        .filter((r) => r.status === "accepted")
        .map((r) => ({
          friendshipId: r.id,
          profile: profOf(r.requester === user.id ? r.addressee : r.requester),
        })),
    );
    setIncoming(
      rows
        .filter((r) => r.status === "pending" && r.addressee === user.id)
        .map((r) => ({ friendshipId: r.id, profile: profOf(r.requester) })),
    );
    setOutgoing(
      rows
        .filter((r) => r.status === "pending" && r.requester === user.id)
        .map((r) => ({ friendshipId: r.id, profile: profOf(r.addressee) })),
    );
  }, [supabase]);

  useEffect(() => {
    // Asynchrones Laden beim Mount – setState passiert erst nach den awaits.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const saveUsername = async () => {
    setProfileMsg(null);
    const value = username.trim().toLowerCase().replace(/\s+/g, "_");
    if (value.length < 3) {
      setProfileMsg("Mindestens 3 Zeichen.");
      return;
    }
    if (!me) return;
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: me, username: value }, { onConflict: "id" });
    if (error) {
      setProfileMsg(
        error.code === "23505"
          ? "Benutzername ist bereits vergeben."
          : error.message,
      );
      return;
    }
    setSavedUsername(value);
    setUsername(value);
    setProfileMsg("Gespeichert.");
  };

  const runSearch = async () => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("id, username, display_name")
      .ilike("username", `%${q}%`)
      .limit(10);
    const known = new Set<string>([
      me ?? "",
      ...friends.map((f) => f.profile.id),
      ...incoming.map((f) => f.profile.id),
      ...outgoing.map((f) => f.profile.id),
    ]);
    setResults(((data as Profile[]) ?? []).filter((p) => !known.has(p.id)));
    setSearching(false);
  };

  const sendRequest = async (addressee: string) => {
    if (!me) return;
    await supabase
      .from("friendships")
      .insert({ requester: me, addressee, status: "pending" });
    setResults((prev) => prev.filter((p) => p.id !== addressee));
    load();
  };

  const accept = async (friendshipId: string) => {
    await supabase
      .from("friendships")
      .update({ status: "accepted" })
      .eq("id", friendshipId);
    load();
  };

  const remove = async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    load();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="card flex items-center gap-3 p-4">
        <button
          onClick={() => router.push("/")}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Zurück"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-2">
          <Users size={18} className="text-accent" />
          <div>
            <p className="text-lg font-bold leading-tight">Freunde</p>
            <p className="text-xs text-muted">
              Verbinde dich und sieh, wer trainiert.
            </p>
          </div>
        </div>
      </div>

      {/* Dein Profil */}
      <section className="card flex flex-col gap-3 p-4">
        <p className="font-bold">Dein Benutzername</p>
        <p className="text-sm text-muted">
          Unter diesem Namen finden dich andere.
        </p>
        <div className="flex gap-2">
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="z. B. lip1337"
            className="input flex-1"
          />
          <button onClick={saveUsername} className="btn-primary">
            Speichern
          </button>
        </div>
        {profileMsg && <p className="text-xs text-muted">{profileMsg}</p>}
        {!savedUsername && (
          <p className="text-xs text-accent">
            Lege einen Benutzernamen fest, damit dich Freunde hinzufügen können.
          </p>
        )}
      </section>

      {/* Freund hinzufügen */}
      <section className="card flex flex-col gap-3 p-4">
        <p className="font-bold">Freund hinzufügen</p>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Benutzername suchen…"
              className="input pl-9"
            />
          </div>
          <button onClick={runSearch} className="btn-ghost">
            Suchen
          </button>
        </div>
        {searching && <p className="text-xs text-muted">Suche…</p>}
        {results.length > 0 && (
          <div className="flex flex-col gap-1">
            {results.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-line bg-sunken px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <UserRound size={16} />
                </div>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {label(p)}
                </span>
                <button
                  onClick={() => sendRequest(p.id)}
                  className="btn-primary px-3 py-1.5 text-sm"
                >
                  <UserPlus size={15} />
                  Anfragen
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Eingehende Anfragen */}
      {incoming.length > 0 && (
        <section className="card flex flex-col gap-3 p-4">
          <p className="font-bold">Anfragen an dich</p>
          <div className="flex flex-col gap-1">
            {incoming.map((r) => (
              <div
                key={r.friendshipId}
                className="flex items-center gap-3 rounded-xl border border-line bg-sunken px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {label(r.profile)}
                </span>
                <button
                  onClick={() => accept(r.friendshipId)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-white"
                  aria-label="Annehmen"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={() => remove(r.friendshipId)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-red-400"
                  aria-label="Ablehnen"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ausgehende Anfragen */}
      {outgoing.length > 0 && (
        <section className="card flex flex-col gap-3 p-4">
          <p className="font-bold">Gesendete Anfragen</p>
          <div className="flex flex-col gap-1">
            {outgoing.map((r) => (
              <div
                key={r.friendshipId}
                className="flex items-center gap-3 rounded-xl border border-line bg-sunken px-3 py-2.5"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {label(r.profile)}
                </span>
                <span className="text-xs text-muted">ausstehend</span>
                <button
                  onClick={() => remove(r.friendshipId)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-line text-muted transition-colors hover:text-red-400"
                  aria-label="Zurückziehen"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Freundesliste */}
      <section className="card flex flex-col gap-3 p-4">
        <p className="font-bold">Deine Freunde ({friends.length})</p>
        {friends.length === 0 ? (
          <p className="py-2 text-sm text-muted">
            Noch keine Freunde – suche oben nach einem Benutzernamen.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            {friends.map((r) => (
              <div
                key={r.friendshipId}
                className="flex items-center gap-3 rounded-xl border border-line bg-sunken px-3 py-2.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <UserRound size={16} />
                </div>
                <span className="min-w-0 flex-1 truncate font-medium">
                  {label(r.profile)}
                </span>
                <button
                  onClick={() => remove(r.friendshipId)}
                  className="rounded-lg border border-line px-3 py-1.5 text-sm text-muted transition-colors hover:text-red-400"
                >
                  Entfernen
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
