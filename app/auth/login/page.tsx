"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    console.log(error);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <form
      onSubmit={handleLogin}
      className="flex flex-col bg-[#141A24] text-white p-4 m-4 rounded-xl gap-4 text-center"
    >
      <p className="font-bold text-xl">Login Page</p>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="p-2 rounded bg-[#1E2A38] text-white border border-gray-600"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="p-2 rounded bg-[#1E2A38] text-white border border-gray-600"
      />

      <button
        type="submit"
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
      >
        Login
      </button>

      {message && <p className="text-sm text-red-400">{message}</p>}

      <p className="text-[#94A3B8]">Don't have an account?</p>

      <Link href="/auth/register" className="text-blue-500 hover:underline">
        Register
      </Link>
    </form>
  );
}