"use client";

import { useEffect, useState } from "react";
import { Dumbbell, Plus, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { MUSCLE_GROUPS, type MuscleGroup } from "@/app/data/exercises";

type AdminExercise = {
  id: string;
  name: string;
  muscle_group: string;
  description: string | null;
};

export default function AdminExercises() {
  const supabase = createClient();

  const [list, setList] = useState<AdminExercise[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [group, setGroup] = useState<MuscleGroup>("Brust");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase
      .from("exercises")
      .select("id, name, muscle_group, description")
      .order("muscle_group")
      .order("name")
      .then(({ data }) => {
        if (!active) return;
        setList((data as AdminExercise[]) ?? []);
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [supabase]);

  const addExercise = async () => {
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Bitte einen Namen eingeben.");
      return;
    }

    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error: insertError } = await supabase
      .from("exercises")
      .insert({
        name: trimmed,
        muscle_group: group,
        description: description.trim() || null,
        created_by: user?.id ?? null,
      })
      .select("id, name, muscle_group, description")
      .single();

    setSaving(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setList((prev) =>
        [...prev, data as AdminExercise].sort(
          (a, b) =>
            a.muscle_group.localeCompare(b.muscle_group, "de") ||
            a.name.localeCompare(b.name, "de"),
        ),
      );
    }
    setName("");
    setDescription("");
  };

  const removeExercise = async (id: string) => {
    if (!window.confirm("Diese Übung wirklich löschen?")) return;
    const { error: deleteError } = await supabase
      .from("exercises")
      .delete()
      .eq("id", id);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    setList((prev) => prev.filter((e) => e.id !== id));
  };

  return (
    <section className="card flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Dumbbell size={18} className="text-accent" />
        <p className="font-bold">Übungen verwalten</p>
        <span className="rounded-full border border-line px-2 py-0.5 text-xs text-muted">
          {list.length}
        </span>
      </div>
      <p className="text-sm text-muted">
        Von dir angelegte Übungen erscheinen bei allen Nutzern in der Übungsauswahl –
        inklusive Erklärung.
      </p>

      {/* Formular */}
      <div className="flex flex-col gap-2 rounded-xl border border-line bg-sunken p-3">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name der Übung"
            className="input flex-1"
          />
          <select
            value={group}
            onChange={(e) => setGroup(e.target.value as MuscleGroup)}
            className="input sm:w-44"
          >
            {MUSCLE_GROUPS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Erklärung / Ausführung (optional)"
          rows={3}
          className="input resize-y"
        />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          onClick={addExercise}
          disabled={saving || !name.trim()}
          className="btn-primary self-start"
        >
          <Plus size={16} />
          {saving ? "Speichern…" : "Übung anlegen"}
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <p className="py-4 text-center text-sm text-muted">Wird geladen…</p>
      ) : list.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted">
          Noch keine eigenen Übungen angelegt.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {list.map((ex) => (
            <div
              key={ex.id}
              className="flex items-start gap-3 rounded-xl border border-line bg-sunken px-3 py-2.5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{ex.name}</span>
                  <span className="rounded-md bg-surface px-2 py-0.5 text-xs text-muted">
                    {ex.muscle_group}
                  </span>
                </div>
                {ex.description && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted">
                    {ex.description}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeExercise(ex.id)}
                className="shrink-0 rounded-lg p-1.5 text-muted transition-colors hover:bg-red-400/10 hover:text-red-400"
                aria-label="Übung löschen"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
