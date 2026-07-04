import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import TrainingPlansList from "./TrainingPlansList";
import CreateTraining from "./create_training";

export default async function Training() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data } = await supabase
    .from("plans")
    .select("*")
    .eq("user", user.id)
    .order("name");

  const plans = data ?? [];

  return (
    <section className="card flex flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <p className="text-lg font-bold">Deine Trainingspläne</p>
        <span className="rounded-full border border-line px-2.5 py-0.5 text-sm font-semibold text-muted">
          {plans.length}
        </span>
      </div>

      {plans.length === 0 ? (
        <p className="text-sm text-muted">
          Noch keine Pläne – erstelle unten deinen ersten Trainingsplan.
        </p>
      ) : (
        <TrainingPlansList plans={plans} />
      )}

      <CreateTraining />
    </section>
  );
}
