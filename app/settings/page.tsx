import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { createClient } from "@/utils/supabase/server";
import SettingsForm from "./SettingsForm";

export const metadata: Metadata = {
  title: "Einstellungen",
};

export default async function SettingsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  return <SettingsForm email={user.email ?? ""} />;
}
