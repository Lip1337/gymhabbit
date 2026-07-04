"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Plus, X } from "lucide-react";
import PlanFormFields, { Machine, emptyMachine } from "./PlanFormFields";

export default function CreateTraining() {
  const [isOpen, setIsOpen] = useState(false);
  const [planName, setPlanName] = useState("");
  const [machines, setMachines] = useState<Machine[]>([emptyMachine()]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const addMachine = () => {
    setMachines([...machines, emptyMachine()]);
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

  const resetForm = () => {
    setPlanName("");
    setMachines([emptyMachine()]);
    setError(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const handleSave = async () => {
    setError(null);

    if (!planName.trim()) {
      setError("Bitte gib einen Namen für den Trainingsplan ein.");
      return;
    }

    const validMachines = machines.filter((m) => m.name.trim() !== "");
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
      setError("Du musst angemeldet sein, um einen Plan zu erstellen.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("plans").insert({
      name: planName,
      user: user.id,
      data: validMachines,
    });

    setLoading(false);

    if (insertError) {
      setError("Fehler beim Speichern: " + insertError.message);
      return;
    }

    handleClose();
    router.refresh();
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-line p-3 font-semibold text-muted transition-colors hover:border-accent/60 hover:text-accent"
      >
        <Plus size={18} />
        Neuen Plan erstellen
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="card flex max-h-[90vh] w-full max-w-lg flex-col gap-5 overflow-y-auto p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <p className="text-xl font-bold text-white">Neuer Trainingsplan</p>
              <button
                onClick={handleClose}
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
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            {/* Footer */}
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={handleClose} className="btn-ghost">
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={loading} className="btn-primary">
                {loading ? "Speichern..." : "Plan speichern"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
