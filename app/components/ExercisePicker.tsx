"use client";

import { useEffect, useMemo, useState } from "react";
import { Info, Plus, Search, Trash2, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import {
  CURATED_EXERCISES,
  MUSCLE_GROUPS,
  type ExerciseEntry,
  type MuscleGroup,
} from "@/app/data/exercises";

const CUSTOM_KEY = "custom_exercises";

type Filter = "Alle" | "Eigene" | MuscleGroup;

function loadCustom(): ExerciseEntry[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const raw = localStorage.getItem(CUSTOM_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is ExerciseEntry =>
        e &&
        typeof e.name === "string" &&
        MUSCLE_GROUPS.includes(e.group as MuscleGroup),
    );
  } catch {
    return [];
  }
}

function saveCustom(list: ExerciseEntry[]) {
  localStorage.setItem(CUSTOM_KEY, JSON.stringify(list));
}

export default function ExercisePicker({
  onSelect,
  onClose,
}: {
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const supabase = useMemo(() => createClient(), []);

  const [filter, setFilter] = useState<Filter>("Alle");
  const [query, setQuery] = useState("");
  const [custom, setCustom] = useState<ExerciseEntry[]>(() => loadCustom());
  const [dbExercises, setDbExercises] = useState<
    { name: string; group: string; description: string | null }[]
  >([]);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newGroup, setNewGroup] = useState<MuscleGroup>("Brust");
  const [showCreate, setShowCreate] = useState(false);

  // Vom Admin angelegte Übungen (geteilter Katalog) laden.
  useEffect(() => {
    let active = true;
    supabase
      .from("exercises")
      .select("name, muscle_group, description")
      .then(({ data }) => {
        if (!active || !data) return;
        setDbExercises(
          data.map((d) => ({
            name: d.name as string,
            group: d.muscle_group as string,
            description: (d.description as string | null) ?? null,
          })),
        );
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const customNames = useMemo(
    () => new Set(custom.map((e) => e.name.toLowerCase())),
    [custom],
  );

  // Erklärungen aus dem Admin-Katalog nach Übungsname.
  const descriptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const e of dbExercises) {
      if (e.description) map.set(e.name.toLowerCase(), e.description);
    }
    return map;
  }, [dbExercises]);

  // Eigene + Admin-Katalog + kuratierte Liste, Duplikate nach Namen entfernen
  // (Priorität: eigene > Admin > kuratiert).
  const all = useMemo<ExerciseEntry[]>(() => {
    const seen = new Set<string>();
    const result: ExerciseEntry[] = [];
    const push = (e: ExerciseEntry) => {
      const key = e.name.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      result.push(e);
    };
    custom.forEach(push);
    dbExercises.forEach((e) => push({ name: e.name, group: e.group as MuscleGroup }));
    CURATED_EXERCISES.forEach(push);
    return result;
  }, [custom, dbExercises]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all
      .filter((e) => {
        if (filter === "Eigene") return customNames.has(e.name.toLowerCase());
        if (filter !== "Alle" && e.group !== filter) return false;
        return true;
      })
      .filter((e) => (q ? e.name.toLowerCase().includes(q) : true))
      .sort((a, b) => a.name.localeCompare(b.name, "de"));
  }, [all, filter, query, customNames]);

  const addCustom = () => {
    const name = newName.trim();
    if (!name) return;
    const next = [{ name, group: newGroup }, ...custom.filter((e) => e.name !== name)];
    setCustom(next);
    saveCustom(next);
    onSelect(name);
    onClose();
  };

  const removeCustom = (name: string) => {
    const next = custom.filter((e) => e.name !== name);
    setCustom(next);
    saveCustom(next);
  };

  const chips: Filter[] = ["Alle", ...MUSCLE_GROUPS, "Eigene"];

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="card flex max-h-[85vh] w-full max-w-lg flex-col gap-3 rounded-b-none p-4 sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-lg font-bold">Übung wählen</p>
          <button
            onClick={onClose}
            className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>

        {/* Suche */}
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Übung suchen…"
            className="input pl-9"
          />
        </div>

        {/* Filter-Chips */}
        <div className="flex flex-wrap gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip}
              onClick={() => setFilter(chip)}
              className={`rounded-full border px-3 py-1 text-sm font-medium transition-colors ${
                filter === chip
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:border-faint"
              }`}
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Liste */}
        <div className="-mx-1 flex-1 overflow-y-auto px-1">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted">
              Keine Übung gefunden.
            </p>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((exercise) => {
                const key = exercise.name.toLowerCase();
                const isCustom = customNames.has(key);
                const desc = descriptions.get(key);
                const isOpen = expanded === exercise.name;
                return (
                  <div
                    key={exercise.name}
                    className="flex flex-col gap-2 rounded-xl border border-line bg-sunken px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          onSelect(exercise.name);
                          onClose();
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <span className="min-w-0 flex-1 truncate font-medium">
                          {exercise.name}
                        </span>
                        <span className="shrink-0 rounded-md bg-surface px-2 py-0.5 text-xs text-muted">
                          {exercise.group}
                        </span>
                      </button>
                      {desc && (
                        <button
                          onClick={() =>
                            setExpanded(isOpen ? null : exercise.name)
                          }
                          className={`shrink-0 rounded-lg p-1.5 transition-colors hover:bg-white/5 ${
                            isOpen ? "text-accent" : "text-muted hover:text-white"
                          }`}
                          aria-label="Erklärung anzeigen"
                        >
                          <Info size={15} />
                        </button>
                      )}
                      {isCustom && (
                        <button
                          onClick={() => removeCustom(exercise.name)}
                          className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-red-400/10 hover:text-red-400"
                          aria-label="Eigene Übung löschen"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                    {desc && isOpen && (
                      <p className="whitespace-pre-wrap border-t border-line pt-2 text-sm text-muted">
                        {desc}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Eigene Übung erstellen */}
        <div className="border-t border-line pt-3">
          {showCreate ? (
            <div className="flex flex-col gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Name der eigenen Übung"
                className="input"
                autoFocus
              />
              <div className="flex gap-2">
                <select
                  value={newGroup}
                  onChange={(e) => setNewGroup(e.target.value as MuscleGroup)}
                  className="input flex-1"
                >
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
                <button
                  onClick={addCustom}
                  disabled={!newName.trim()}
                  className="btn-primary"
                >
                  <Plus size={16} />
                  Hinzufügen
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="btn-ghost w-full"
            >
              <Plus size={16} />
              Eigene Übung erstellen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
