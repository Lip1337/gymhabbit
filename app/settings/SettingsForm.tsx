"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  History,
  KeyRound,
  LogOut,
  Scale,
  Trash2,
  Users,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useSettings } from "@/utils/useSettings";
import { HISTORY_LIMIT_OPTIONS } from "@/utils/settings";

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-accent" : "bg-faint/50"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function SettingsForm({ email }: { email: string }) {
  const router = useRouter();
  const supabase = createClient();
  const { settings, update } = useSettings();

  const [deleting, setDeleting] = useState(false);
  const [historyMsg, setHistoryMsg] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Zurück zur Startseite; refresh, damit Verlauf-Einstellungen dort greifen.
  const handleBack = () => {
    router.push("/");
    router.refresh();
  };

  const handleDeleteHistory = async () => {
    if (
      !window.confirm(
        "Wirklich den gesamten Trainingsverlauf löschen? Das kann nicht rückgängig gemacht werden.",
      )
    ) {
      return;
    }

    setHistoryMsg(null);
    setDeleting(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setDeleting(false);
      setHistoryMsg("Nicht angemeldet.");
      return;
    }

    const { error } = await supabase
      .from("workout_sessions")
      .delete()
      .eq("user", user.id);

    setDeleting(false);

    if (error) {
      setHistoryMsg("Fehler: " + error.message);
      return;
    }

    setHistoryMsg("Verlauf gelöscht.");
    router.refresh();
  };

  const handleChangePassword = async () => {
    setPwMsg(null);

    if (newPassword.length < 6) {
      setPwMsg({ ok: false, text: "Passwort muss mindestens 6 Zeichen haben." });
      return;
    }

    setPwSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setPwSaving(false);

    if (error) {
      setPwMsg({ ok: false, text: error.message });
      return;
    }

    setNewPassword("");
    setPwMsg({ ok: true, text: "Passwort aktualisiert." });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  };

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      {/* Header */}
      <div className="card flex items-center gap-3 p-4">
        <button
          onClick={handleBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
          aria-label="Zurück"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="text-lg font-bold leading-tight">Einstellungen</p>
          <p className="text-xs text-muted">Passe GymHabbit an dich an.</p>
        </div>
      </div>

      {/* Verlauf */}
      <section className="card flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <History size={18} className="text-accent" />
          <p className="font-bold">Verlauf</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">Verlauf anzeigen</p>
            <p className="text-xs text-muted">
              Zeigt abgeschlossene Trainings auf der Startseite.
            </p>
          </div>
          <Toggle
            label="Verlauf anzeigen"
            checked={settings.showHistory}
            onChange={(value) => update({ showHistory: value })}
          />
        </div>

        <div
          className={`flex items-center justify-between gap-3 ${
            settings.showHistory ? "" : "pointer-events-none opacity-40"
          }`}
        >
          <div className="min-w-0">
            <p className="font-medium">Angezeigte Einträge</p>
            <p className="text-xs text-muted">Wie viele Trainings sichtbar sind.</p>
          </div>
          <select
            value={settings.historyLimit}
            onChange={(e) => update({ historyLimit: Number(e.target.value) })}
            className="input w-24"
          >
            {HISTORY_LIMIT_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="border-t border-line pt-3">
          <button
            onClick={handleDeleteHistory}
            disabled={deleting}
            className="btn-danger w-full"
          >
            <Trash2 size={16} />
            {deleting ? "Wird gelöscht…" : "Trainingsverlauf löschen"}
          </button>
          {historyMsg && (
            <p className="mt-2 text-center text-xs text-muted">{historyMsg}</p>
          )}
        </div>
      </section>

      {/* Freunde */}
      <section className="card flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-accent" />
          <p className="font-bold">Freunde</p>
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="font-medium">Freunde-Karte anzeigen</p>
            <p className="text-xs text-muted">
              Zeigt auf der Startseite, wer gerade trainiert.
            </p>
          </div>
          <Toggle
            label="Freunde-Karte anzeigen"
            checked={settings.showFriends}
            onChange={(value) => update({ showFriends: value })}
          />
        </div>

        <Link href="/friends" className="btn-ghost w-full">
          <Users size={16} />
          Freunde verwalten
        </Link>
      </section>

      {/* Gewichtseinheit */}
      <section className="card flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Scale size={18} className="text-accent" />
          <p className="font-bold">Gewichtseinheit</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["kg", "lbs"] as const).map((unit) => (
            <button
              key={unit}
              onClick={() => update({ unit })}
              className={`rounded-xl border py-2.5 font-semibold transition-colors ${
                settings.unit === unit
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-muted hover:border-faint"
              }`}
            >
              {unit === "kg" ? "Kilogramm (kg)" : "Pfund (lbs)"}
            </button>
          ))}
        </div>
      </section>

      {/* Standard-Übungswerte */}
      <section className="card flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <Dumbbell size={18} className="text-accent" />
          <p className="font-bold">Standard-Übungswerte</p>
        </div>
        <p className="text-xs text-muted">
          Vorbelegung für neue Übungen beim Erstellen eines Plans.
        </p>
        <div className="grid grid-cols-3 gap-2">
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Gewicht ({settings.unit})</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              value={settings.defaultWeight || ""}
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) =>
                update({ defaultWeight: Math.max(0, Number(e.target.value) || 0) })
              }
              className="input text-center"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Sätze</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={settings.defaultSets || ""}
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) =>
                update({ defaultSets: Math.max(0, Number(e.target.value) || 0) })
              }
              className="input text-center"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs text-muted">Wdh.</span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              value={settings.defaultReps || ""}
              placeholder="0"
              onFocus={(e) => e.currentTarget.select()}
              onChange={(e) =>
                update({ defaultReps: Math.max(0, Number(e.target.value) || 0) })
              }
              className="input text-center"
            />
          </label>
        </div>
      </section>

      {/* Konto */}
      <section className="card flex flex-col gap-4 p-4">
        <div className="flex items-center gap-2">
          <KeyRound size={18} className="text-accent" />
          <p className="font-bold">Konto</p>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted">
            Eingeloggt als
          </p>
          <p className="mt-1 break-all font-medium">{email}</p>
        </div>

        <div className="flex flex-col gap-2 border-t border-line pt-3">
          <label className="label">Neues Passwort</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Mindestens 6 Zeichen"
            className="input"
          />
          <button
            onClick={handleChangePassword}
            disabled={pwSaving || newPassword.length === 0}
            className="btn-primary"
          >
            {pwSaving ? "Speichern…" : "Passwort ändern"}
          </button>
          {pwMsg && (
            <p
              className={`text-center text-xs ${
                pwMsg.ok ? "text-accent" : "text-red-400"
              }`}
            >
              {pwMsg.text}
            </p>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="btn-ghost w-full !text-red-400 hover:!bg-red-400/10"
        >
          <LogOut size={16} />
          Logout
        </button>
      </section>

    </div>
  );
}
