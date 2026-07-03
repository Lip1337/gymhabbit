"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil } from "lucide-react";
import EditTrainingPlan from "./EditTrainingPlan";

type Plan = {
  id: string;
  name: string;
  data: {
    name: string;
    gewicht: number;
    saetze: number;
    wiederholungen: number;
  }[];
};

export default function TrainingPlansList({ plans }: { plans: Plan[] }) {
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  return (
    <>
      <div className="flex justify-center items-center w-full gap-4 flex-wrap">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className="relative bg-[#06B3E3] px-5 py-3 rounded-xl flex justify-center items-center group"
          >
            <Link href={`/training/${plan.id}`} className="pr-2">
              <p className="text-white font-semibold">{plan.name}</p>
            </Link>
            <button
              onClick={(e) => {
                e.preventDefault();
                setEditingPlan(plan);
              }}
              className="ml-1 p-1 rounded-md hover:bg-white/20 transition-colors"
              aria-label="Plan bearbeiten"
            >
              <Pencil size={14} className="text-white" />
            </button>
          </div>
        ))}
      </div>

      {editingPlan && (
        <EditTrainingPlan plan={editingPlan} onClose={() => setEditingPlan(null)} />
      )}
    </>
  );
}