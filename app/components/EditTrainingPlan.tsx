"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import PlanFormFields, { Machine, emptyMachine } from "./PlanFormFields";
import { useSettings } from "@/utils/useSettings";

type Plan = {
  id: string;
  name: string;
  data: Machine[];
};

export default function EditTrainingPlan({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const { settings } = useSettings();

  const [planName, setPlanName] = useState(plan.name);
  const [machines, setMachines] = useState<Machine[]>(
    plan.data.length > 0 ? plan.data : [emptyMachine()]
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const addMachine = () => {
    setMachines([
      ...machines,
      {
        name: "",
        gewicht: settings.defaultWeight,
        saetze: settings.defaultSets,
        wiederholungen: settings.defaultReps,
      },
    ]);
  };

  const removeMachine = (index: number) => {
    setMachines(machines.filter((_, i) => i !== index));
  };

  const updateMachine = (index: number, field: keyof Machine, value: string) => {
    const updated = [...machines];
    updated[index] = {
      ...updated[index],
      [field]: field === "name" ? value : Number(value),
    };
    setMachines(updated);
  };

  const handleSave = async () => {
    setError(null);

    if (!planName.trim()) {
      setError("Bitte gib einen Namen für den Trainingsplan ein.");
      return;
    }

    const validMachines = machines
      .filter((m) => m.name.trim() !== "")
      // Manuelle Bearbeitung ist maßgeblich: gespeicherte Pro-Satz-Werte zurücksetzen,
      // sie werden beim nächsten Training wieder neu aus den Sätzen aufgebaut.
      .map((m) => ({
        name: m.name,
        gewicht: m.gewicht,
        saetze: m.saetze,
        wiederholungen: m.wiederholungen,
      }));
    if (validMachines.length === 0) {
      setError("Bitte füge mindestens eine Übung hinzu.");
      return;
    }

    setLoading(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Du musst angemeldet sein, um den Plan zu bearbeiten.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("plans")
      .update({ name: planName, data: validMachines })
      .eq("id", plan.id)
      .eq("user", user.id);

    setLoading(false);

    if (updateError) {
      setError("Fehler beim Speichern: " + updateError.message);
      return;
    }

    router.refresh();
    onClose();
  };

  const handleDelete = async () => {
    setError(null);
    setDeleting(true);

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setError("Du musst angemeldet sein, um den Plan zu löschen.");
      setDeleting(false);
      return;
    }

    const { error: deleteError } = await supabase
      .from("plans")
      .delete()
      .eq("id", plan.id)
      .eq("user", user.id);

    setDeleting(false);

    if (deleteError) {
      setError("Fehler beim Löschen: " + deleteError.message);
      return;
    }

    router.refresh();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="card flex max-h-[90vh] w-full max-w-lg flex-col gap-5 overflow-y-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-xl font-bold text-white">Trainingsplan bearbeiten</p>
          <button
            onClick={onClose}
            className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Schließen"
          >
            <X size={18} />
          </button>
        </div>

        <PlanFormFields
          planName={planName}
          onPlanNameChange={setPlanName}
          machines={machines}
          onAddMachine={addMachine}
          onRemoveMachine={removeMachine}
          onUpdateMachine={updateMachine}
          unit={settings.unit}
        />

        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleDelete}
            disabled={deleting || loading}
            className="btn-danger"
          >
            {deleting ? "Löschen..." : "Plan löschen"}
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost">
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={loading || deleting}
              className="btn-primary"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
