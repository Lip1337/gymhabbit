"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";

export default function Register() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("Account erstellt! Check deine E-Mails.");
  }

  return (
    <form
      onSubmit={handleRegister}
      className="flex flex-col bg-[#141A24] text-white p-4 m-4 rounded-xl gap-4 text-center"
    >
      <p className="font-bold text-xl">Register Page</p>

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
        Register
      </button>

      {message && <p className="text-sm text-[#94A3B8]">{message}</p>}

      <p className="text-[#94A3B8]">Already have an account?</p>

      <Link href="/auth/login" className="text-blue-500 hover:underline">
        Login
      </Link>
    </form>
  );
}