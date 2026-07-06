"use client";

import { useMemo, useState } from "react";
import { Search, UserRound } from "lucide-react";
import { BarChart } from "../dashboard/charts";
import type { PersonalRecord, VolumePoint } from "@/utils/stats";

export type AdminUserRow = {
  id: string;
  email: string;
  createdAt: string;
  totalWorkouts: number;
  thisWeek: number;
  totalVolume: number;
  dayStreak: number;
  lastWorkout: string | null;
  volume: VolumePoint[];
  prs: PersonalRecord[];
  recent: {
    id: string;
    date: string;
    plan: string;
    exercises: number;
    volume: number;
  }[];
};

function fmt(n: number): string {
  return n.toLocaleString("de-DE");
}

export default function AdminUsers({
  rows,
  unit,
}: {
  rows: AdminUserRow[];
  unit: string;
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(rows[0]?.id ?? "");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? rows.filter((r) => r.email.toLowerCase().includes(q)) : rows;
  }, [rows, query]);

  const selected =
    rows.find((r) => r.id === selectedId) ?? filtered[0] ?? rows[0] ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {/* Nutzerliste */}
      <section className="card flex max-h-[75vh] flex-col gap-3 p-4 lg:col-span-1">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="E-Mail suchen…"
            className="input pl-9"
          />
        </div>

        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          <div className="flex flex-col gap-1">
            {filtered.map((row) => {
              const active = selected?.id === row.id;
              return (
                <button
                  key={row.id}
                  onClick={() => setSelectedId(row.id)}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors ${
                    active
                      ? "border-accent bg-accent/10"
                      : "border-line bg-sunken hover:border-faint"
                  }`}
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
                    <UserRound size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{row.email}</p>
                    <p className="text-xs text-muted">
                      {fmt(row.totalWorkouts)} Trainings
                      {row.lastWorkout ? ` · zuletzt ${row.lastWorkout}` : ""}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <p className="py-6 text-center text-sm text-muted">
                Kein Nutzer gefunden.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Detailansicht */}
      <section className="flex flex-col gap-4 lg:col-span-2">
        {!selected ? (
          <div className="card p-6 text-center text-sm text-muted">
            Keine Nutzer vorhanden.
          </div>
        ) : (
          <>
            <div className="card flex flex-col gap-1 p-4">
              <p className="break-all text-lg font-bold">{selected.email}</p>
              <p className="text-xs text-muted">
                Registriert am{" "}
                {new Date(selected.createdAt).toLocaleDateString("de-DE")} · ID{" "}
                {selected.id.slice(0, 8)}…
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { label: "Trainings", value: fmt(selected.totalWorkouts) },
                { label: "Diese Woche", value: fmt(selected.thisWeek) },
                { label: `Volumen (${unit})`, value: fmt(selected.totalVolume) },
                { label: "Streak (Tage)", value: fmt(selected.dayStreak) },
              ].map((kpi) => (
                <div key={kpi.label} className="card flex flex-col gap-1 p-3">
                  <p className="text-xl font-bold leading-none">{kpi.value}</p>
                  <p className="text-xs text-muted">{kpi.label}</p>
                </div>
              ))}
            </div>

            <section className="card flex flex-col gap-3 p-4">
              <p className="font-bold">Volumen pro Training ({unit})</p>
              <BarChart data={selected.volume} />
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="card flex flex-col gap-3 p-4">
                <p className="font-bold">Bestleistungen</p>
                {selected.prs.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">
                    Keine Daten.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted">
                        <th className="pb-2 font-medium">Übung</th>
                        <th className="pb-2 text-right font-medium">Max ({unit})</th>
                        <th className="pb-2 text-right font-medium">Wdh.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.prs.map((pr) => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>

              <section className="card flex flex-col gap-3 p-4">
                <p className="font-bold">Letzte Trainings</p>
                {selected.recent.length === 0 ? (
                  <p className="py-4 text-center text-sm text-muted">
                    Keine Daten.
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase tracking-wider text-muted">
                        <th className="pb-2 font-medium">Datum</th>
                        <th className="pb-2 font-medium">Plan</th>
                        <th className="pb-2 text-right font-medium">Volumen</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.recent.map((r) => (
                        <tr key={r.id} className="border-t border-line">
                          <td className="py-2 pr-2 text-muted">{r.date}</td>
                          <td className="max-w-[9rem] truncate py-2 pr-2 font-medium">
                            {r.plan}
                          </td>
                          <td className="py-2 text-right font-semibold">
                            {fmt(r.volume)} {unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
