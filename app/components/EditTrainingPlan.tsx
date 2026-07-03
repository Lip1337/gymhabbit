"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { X, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

type Machine = {
  name: string;
  gewicht: number;
  saetze: number;
  wiederholungen: number;
};

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
  const [planName, setPlanName] = useState(plan.name);
  const [machines, setMachines] = useState<Machine[]>(
    plan.data.length > 0
      ? plan.data
      : [{ name: "", gewicht: 0, saetze: 0, wiederholungen: 0 }]
  );
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();
  const router = useRouter();

  const addMachine = () => {
    setMachines([...machines, { name: "", gewicht: 0, saetze: 0, wiederholungen: 0 }]);
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

    const validMachines = machines.filter((m) => m.name.trim() !== "");
    if (validMachines.length === 0) {
      setError("Bitte füge mindestens eine Maschine hinzu.");
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="bg-[#141A24] border border-[#2E3A4E] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 flex flex-col gap-5">
        {/* Header */}
        <div className="flex justify-between items-center">
          <p className="text-xl font-bold text-white">Trainingsplan bearbeiten</p>
          <button
            onClick={onClose}
            className="border border-[#2E3A4E] rounded-lg p-1.5 hover:bg-[#1C2432] transition-colors"
          >
            <X size={18} className="text-[#94A3B8]" />
          </button>
        </div>

        {/* Plan Name */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-[#94A3B8]">Name des Plans</label>
          <input
            type="text"
            value={planName}
            onChange={(e) => setPlanName(e.target.value)}
            className="bg-[#0F1420] border border-[#2E3A4E] rounded-lg px-3 py-2 text-white placeholder:text-[#4B5768] outline-none focus:border-[#06B3E3] transition-colors"
          />
        </div>

        {/* Maschinen */}
        <div className="flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-[#94A3B8]">Maschinen</label>
            <button
              onClick={addMachine}
              className="flex items-center gap-1 text-sm text-[#06B3E3] font-semibold hover:opacity-80 transition-opacity"
            >
              <Plus size={16} /> Hinzufügen
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {machines.map((machine, index) => (
              <div
                key={index}
                className="bg-[#0F1420] border border-[#2E3A4E] rounded-lg p-3 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    value={machine.name}
                    onChange={(e) => updateMachine(index, "name", e.target.value)}
                    placeholder="Name der Maschine"
                    className="flex-1 bg-transparent border-b border-[#2E3A4E] px-1 py-1 text-white placeholder:text-[#4B5768] outline-none focus:border-[#06B3E3] transition-colors"
                  />
                  {machines.length > 1 && (
                    <button
                      onClick={() => removeMachine(index)}
                      className="text-[#94A3B8] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#94A3B8]">Gewicht (kg)</span>
                    <input
                      type="number"
                      value={machine.gewicht}
                      onChange={(e) => updateMachine(index, "gewicht", e.target.value)}
                      className="bg-[#141A24] border border-[#2E3A4E] rounded-md px-2 py-1.5 text-white outline-none focus:border-[#06B3E3] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#94A3B8]">Sätze</span>
                    <input
                      type="number"
                      value={machine.saetze}
                      onChange={(e) => updateMachine(index, "saetze", e.target.value)}
                      className="bg-[#141A24] border border-[#2E3A4E] rounded-md px-2 py-1.5 text-white outline-none focus:border-[#06B3E3] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-[#94A3B8]">Wdh.</span>
                    <input
                      type="number"
                      value={machine.wiederholungen}
                      onChange={(e) => updateMachine(index, "wiederholungen", e.target.value)}
                      className="bg-[#141A24] border border-[#2E3A4E] rounded-md px-2 py-1.5 text-white outline-none focus:border-[#06B3E3] transition-colors"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Footer */}
        <div className="flex justify-between items-center gap-3 pt-2">
          <button
            onClick={handleDelete}
            disabled={deleting || loading}
            className="px-4 py-2 rounded-lg border border-red-400/40 text-red-400 font-semibold hover:bg-red-400/10 transition-colors disabled:opacity-50"
          >
            {deleting ? "Löschen..." : "Plan löschen"}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-[#2E3A4E] text-[#94A3B8] font-semibold hover:bg-[#1C2432] transition-colors"
            >
              Abbrechen
            </button>
            <button
              onClick={handleSave}
              disabled={loading || deleting}
              className="px-4 py-2 rounded-lg bg-[#06B3E3] text-white font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Speichern..." : "Speichern"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}