"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { Dumbbell } from "lucide-react";

export default function Register() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setSuccess(false);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSuccess(true);
    setMessage("Account erstellt! Check deine E-Mails.");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Dumbbell size={28} />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">Konto erstellen</p>
          <p className="text-sm text-muted">Starte mit deinem ersten Trainingsplan.</p>
        </div>
      </div>

      <form onSubmit={handleRegister} className="card flex w-full flex-col gap-4 p-6">
        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="email" className="label">
            E-Mail
          </label>
          <input
            id="email"
            type="email"
            placeholder="du@beispiel.de"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input"
          />
        </div>

        <div className="flex flex-col gap-2 text-left">
          <label htmlFor="password" className="label">
            Passwort
          </label>
          <input
            id="password"
            type="password"
            placeholder="Mindestens 6 Zeichen"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Registrieren..." : "Registrieren"}
        </button>

        {message && (
          <p
            className={`text-center text-sm ${
              success ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {message}
          </p>
        )}
      </form>

      <p className="text-sm text-muted">
        Schon ein Konto?{" "}
        <Link href="/auth/login" className="font-semibold text-accent hover:underline">
          Anmelden
        </Link>
      </p>
    </div>
  );
}
