import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import type { Metadata } from "next";

import { createClient } from "@/utils/supabase/server";
import FriendsClient from "./FriendsClient";

export const metadata: Metadata = {
  title: "Freunde",
};

export default async function FriendsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  return <FriendsClient />;
}
