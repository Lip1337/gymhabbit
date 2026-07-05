"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Dumbbell } from "lucide-react";

export default function Login() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const error = new URLSearchParams(window.location.search).get("error");
    if (error) {
      setMessage(error);
    }
  }, []);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  async function handleGoogleLogin() {
    setMessage("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
    // Bei Erfolg leitet Supabase automatisch zu Google weiter,
    // daher braucht es hier keinen router.push.
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Dumbbell size={28} />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">GymHabbit</p>
          <p className="text-sm text-muted">Melde dich an, um weiter zu trainieren.</p>
        </div>
      </div>

      <form onSubmit={handleLogin} className="card flex w-full flex-col gap-4 p-6">
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 font-semibold text-[#141A24] transition-colors hover:bg-gray-100 disabled:opacity-50"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path
              fill="#4285F4"
              d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
            />
            <path
              fill="#34A853"
              d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
            />
            <path
              fill="#FBBC05"
              d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
            />
            <path
              fill="#EA4335"
              d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
            />
          </svg>
          {googleLoading ? "Weiterleitung..." : "Mit Google anmelden"}
        </button>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <p className="text-sm text-muted">oder</p>
          <div className="h-px flex-1 bg-line" />
        </div>

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
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input"
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Anmelden..." : "Anmelden"}
        </button>

        {message && <p className="text-center text-sm text-red-400">{message}</p>}
      </form>

      <p className="text-sm text-muted">
        Noch kein Konto?{" "}
        <Link href="/auth/register" className="font-semibold text-accent hover:underline">
          Registrieren
        </Link>
      </p>
    </div>
  );
}
