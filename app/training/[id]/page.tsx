import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import TrainingSession from "./TrainingSession";

export default async function TrainingSessionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: plan, error } = await supabase
    .from("plans")
    .select("*")
    .eq("id", id)
    .eq("user", user.id)
    .single();

  if (error || !plan) {
    notFound();
  }

  return <TrainingSession plan={plan} />;
}