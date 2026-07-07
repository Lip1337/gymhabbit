import { redirect } from "next/navigation";

import Header from "./components/header";
import Lip1337 from "./components/lip1337";
import Training from "./components/training";
import TrainingHistory from "./components/TrainingHistory";
import FriendsActivity from "./components/FriendsActivity";

import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

export default async function Home() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/auth/login");
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Header />

      <Training />

      <FriendsActivity />

      <TrainingHistory />

      <div className="mt-auto">
        <Lip1337 />
      </div>
    </div>
  );
}
