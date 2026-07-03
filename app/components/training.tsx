import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import TrainingPlansList from "./TrainingPlansList";

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

  const { data, error } = await supabase.from("plans").select("*").eq("user", user.id);

  return (
    <div className="flex justify-between items-center flex-col p-4 bg-[#141A24] text-white rounded-xl border border-[#2E3A4E] gap-3">
      <div className="flex justify-between items-center w-full">
        <p className="text-lg font-bold">Training</p>
        <div className="border border-[#2E3A4E] rounded-xl p-2">
          <img src="/training.svg" alt="Training Icon" />
        </div>
      </div>

      <p className="font-semibold text-[#94A3B8]">Plan auswählen</p>

      <TrainingPlansList plans={data ?? []} />
    </div>
  );
}