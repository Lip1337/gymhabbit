"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, Dumbbell, Pencil } from "lucide-react";
import EditTrainingPlan from "./EditTrainingPlan";
import type { Machine } from "./PlanFormFields";

type Plan = {
  id: string;
  name: string;
  data: Machine[];
};

export default function TrainingPlansList({ plans }: { plans: Plan[] }) {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  return (
    <>
      <div className="flex flex-col gap-2">
        {plans.map((plan) => (
          <Link
            key={plan.id}
            href={`/training/${plan.id}`}
            className="group flex items-center gap-3 rounded-xl border border-line bg-sunken p-3 transition-colors hover:border-accent/60"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
              <Dumbbell size={18} />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{plan.name}</p>
              <p className="text-sm text-muted">
                {plan.data.length}{" "}
                {plan.data.length === 1 ? "Übung" : "Übungen"}
              </p>
            </div>

            <button
              onClick={(e) => {
                e.preventDefault();
                setEditingPlan(plan);
              }}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-white/5 hover:text-white"
              aria-label={`${plan.name} bearbeiten`}
            >
              <Pencil size={16} />
            </button>

            <ChevronRight
              size={18}
              className="text-faint transition-transform group-hover:translate-x-0.5 group-hover:text-accent"
            />
          </Link>
        ))}
      </div>

      {editingPlan && (
        <EditTrainingPlan plan={editingPlan} onClose={() => setEditingPlan(null)} />
      )}
    </>
  );
}
