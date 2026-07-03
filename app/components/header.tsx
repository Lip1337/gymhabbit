"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        setEmail(user.email ?? "");
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
    <motion.div
      initial={{ opacity: 0, y: -25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="flex justify-between items-center p-4 bg-[#141A24] rounded-xl border border-[#2E3A4E]"
    >
      <p className="text-lg font-bold">GymHabbit</p>

      <div className="relative" ref={dropdownRef}>
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setOpen(!open)}
          className="border border-[#2E3A4E] rounded-xl p-2 hover:bg-[#1E2A38] transition-colors"
        >
          <img src="/user.svg" alt="User Icon" className="w-6 h-6" />
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
              className="absolute right-0 mt-3 w-64 rounded-xl border border-[#2E3A4E] bg-[#141A24] shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider">
                  Eingeloggt als
                </p>

                <p className="mt-1 font-medium break-all text-white">
                  {email}
                </p>
              </div>

              <div className="border-t border-[#2E3A4E]" />

              <button
                onClick={handleLogout}
                className="w-full p-3 text-left text-red-400 hover:bg-[#1E2A38] transition-colors"
              >
                Logout
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}