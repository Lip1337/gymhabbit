"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  BarChart3,
  Dumbbell,
  LogOut,
  Settings,
  ShieldCheck,
  User,
  Users,
} from "lucide-react";

export default function Header() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email ?? "");

        const { data: adminRow } = await supabase
          .from("admins")
          .select("user_id")
          .eq("user_id", user.id)
          .maybeSingle();
        setIsAdmin(Boolean(adminRow));
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="card flex items-center justify-between p-4"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent">
          <Dumbbell size={20} />
        </div>
        <div>
          <p className="text-lg font-bold leading-tight">GymHabbit</p>
          <p className="text-xs text-muted">Bleib dran. Jeden Tag.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Schnell-Links: nur auf größeren Screens; auf dem Handy über das Menü. */}
        <div className="hidden items-center gap-2 sm:flex">
          {isAdmin && (
            <Link
              href="/admin"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Admin"
            >
              <ShieldCheck size={18} />
            </Link>
          )}

          <Link
            href="/friends"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Freunde"
          >
            <Users size={18} />
          </Link>

          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Dashboard"
          >
            <BarChart3 size={18} />
          </Link>

          <Link
            href="/settings"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Einstellungen"
          >
            <Settings size={18} />
          </Link>
        </div>

        <div className="relative" ref={dropdownRef}>
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={() => setOpen(!open)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line text-muted transition-colors hover:bg-white/5 hover:text-white"
            aria-label="Konto"
          >
            <User size={18} />
          </motion.button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{
                duration: 0.2,
                ease: "easeOut",
              }}
              className="card absolute right-0 z-50 mt-3 w-64 overflow-hidden shadow-2xl"
            >
              <div className="p-4">
                <p className="text-xs uppercase tracking-wider text-muted">
                  Eingeloggt als
                </p>

                <p className="mt-1 break-all font-medium text-white">
                  {email}
                </p>
              </div>

              <div className="border-t border-line" />

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center gap-2 p-3 text-left text-muted transition-colors hover:bg-white/5 hover:text-white"
                >
                  <ShieldCheck size={16} />
                  Admin
                </Link>
              )}

              <Link
                href="/friends"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 p-3 text-left text-muted transition-colors hover:bg-white/5 hover:text-white"
              >
                <Users size={16} />
                Freunde
              </Link>

              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 p-3 text-left text-muted transition-colors hover:bg-white/5 hover:text-white"
              >
                <BarChart3 size={16} />
                Dashboard
              </Link>

              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-2 p-3 text-left text-muted transition-colors hover:bg-white/5 hover:text-white"
              >
                <Settings size={16} />
                Einstellungen
              </Link>

              <div className="border-t border-line" />

              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 p-3 text-left text-red-400 transition-colors hover:bg-white/5"
              >
                <LogOut size={16} />
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
      </div>
    </motion.header>
  );
}
