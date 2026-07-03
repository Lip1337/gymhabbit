import { redirect } from "next/navigation";

import CreateTraining from "./components/create_training";
import Header from "./components/header";
import Lip1337 from "./components/lip1337";
import Training from "./components/training";

import { createClient } from "@/utils/supabase/server";
import { cookies } from 'next/headers'

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
    <div className="flex flex-col bg-[#0B0F19] text-white p-4 gap-4">
      <Header />

      <Training />

      <CreateTraining />

      <Lip1337 />
    </div>
  );
}