"use client";

import { useState } from "react";
import { ListPlus, Plus, Trash2 } from "lucide-react";
import type { WeightUnit } from "@/utils/settings";
import ExercisePicker from "./ExercisePicker";

export type SetEntry = {
  gewicht: number;
  wiederholungen: number;
};

export type Machine = {
  name: string;
  gewicht: number;
  saetze: number;
  wiederholungen: number;
  // Pro-Satz-Werte, zuletzt im Training eingetragen. Optional/rückwärtskompatibel.
  sets?: SetEntry[];
};

export function emptyMachine(): Machine {
  return { name: "", gewicht: 0, saetze: 0, wiederholungen: 0 };
}

export default function PlanFormFields({
  planName,
  onPlanNameChange,
  machines,
  onAddMachine,
  onRemoveMachine,
  onUpdateMachine,
  unit = "kg",
}: {
  planName: string;
  onPlanNameChange: (value: string) => void;
  machines: Machine[];
  onAddMachine: () => void;
  onRemoveMachine: (index: number) => void;
  onUpdateMachine: (index: number, field: keyof Machine, value: string) => void;
  unit?: WeightUnit;
}) {
  const [pickerIndex, setPickerIndex] = useState<number | null>(null);

  return (
    <>
      {/* Plan Name */}
      <div className="flex flex-col gap-2">
        <label className="label">Name des Plans</label>
        <input
          type="text"
          value={planName}
          onChange={(e) => onPlanNameChange(e.target.value)}
          placeholder="z. B. Push Day"
          className="input"
        />
      </div>

      {/* Maschinen */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <label className="label">Übungen</label>
          <button
            onClick={onAddMachine}
            className="flex items-center gap-1 text-sm font-semibold text-accent transition-opacity hover:opacity-80"
          >
            <Plus size={16} /> Hinzufügen
          </button>
        </div>

        <div className="flex flex-col gap-3">
          {machines.map((machine, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-xl border border-line bg-sunken p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <input
                  type="text"
                  value={machine.name}
                  onChange={(e) => onUpdateMachine(index, "name", e.target.value)}
                  placeholder="Name der Übung"
                  className="flex-1 border-b border-line bg-transparent px-1 py-1 text-white outline-none transition-colors placeholder:text-faint focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => setPickerIndex(index)}
                  className="shrink-0 rounded-lg border border-line p-1.5 text-muted transition-colors hover:border-accent hover:text-accent"
                  aria-label="Übung aus Liste wählen"
                >
                  <ListPlus size={16} />
                </button>
                {machines.length > 1 && (
                  <button
                    onClick={() => onRemoveMachine(index)}
                    className="rounded-lg p-1.5 text-muted transition-colors hover:bg-red-400/10 hover:text-red-400"
                    aria-label="Übung entfernen"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Gewicht ({unit})</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={machine.gewicht || ""}
                    placeholder="0"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => onUpdateMachine(index, "gewicht", e.target.value)}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-white outline-none transition-colors placeholder:text-faint focus:border-accent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Sätze</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={machine.saetze || ""}
                    placeholder="0"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => onUpdateMachine(index, "saetze", e.target.value)}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-white outline-none transition-colors placeholder:text-faint focus:border-accent"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-muted">Wdh.</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={machine.wiederholungen || ""}
                    placeholder="0"
                    onFocus={(e) => e.currentTarget.select()}
                    onChange={(e) => onUpdateMachine(index, "wiederholungen", e.target.value)}
                    className="rounded-lg border border-line bg-surface px-2 py-1.5 text-white outline-none transition-colors placeholder:text-faint focus:border-accent"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {pickerIndex !== null && (
        <ExercisePicker
          onSelect={(name) => onUpdateMachine(pickerIndex, "name", name)}
          onClose={() => setPickerIndex(null)}
        />
      )}
    </>
  );
}
