"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Share, X } from "lucide-react";

const DISMISS_KEY = "a2hs_dismissed";

function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPhone|iPad|iPod/i.test(ua);
  // iPadOS meldet sich als "MacIntel" mit Touch – so erkennen wir es trotzdem.
  const iPadOS =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return iOS || iPadOS;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // Safari-spezifisch für bereits installierte Web-Apps.
    (window.navigator as { standalone?: boolean }).standalone === true
  );
}

export default function AddToHomeScreen() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isIosDevice()) return;
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;

    // Kleiner Delay, damit das Banner nicht sofort ins Gesicht springt.
    const timer = setTimeout(() => setShow(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="fixed inset-x-0 bottom-0 z-50 flex justify-center p-4"
        >
          <div className="card w-full max-w-lg p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent">
                <Share size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold">Zum Home-Bildschirm hinzufügen</p>
                <p className="mt-0.5 text-sm text-muted">
                  Installiere GymHabbit wie eine App auf deinem iPhone oder iPad.
                </p>
              </div>
              <button
                onClick={dismiss}
                className="rounded-lg border border-line p-1.5 text-muted transition-colors hover:bg-white/5 hover:text-white"
                aria-label="Schließen"
              >
                <X size={16} />
              </button>
            </div>

            <ol className="mt-3 flex flex-col gap-2 border-t border-line pt-3 text-sm">
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-muted">
                  1
                </span>
                <span className="flex flex-wrap items-center gap-1 text-muted">
                  Tippe unten in Safari auf
                  <Share size={15} className="inline text-accent" />
                  <span className="font-medium text-white">Teilen</span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-muted">
                  2
                </span>
                <span className="flex flex-wrap items-center gap-1 text-muted">
                  Wähle
                  <span className="inline-flex items-center gap-1 font-medium text-white">
                    <Plus size={14} className="text-accent" />
                    Zum Home-Bildschirm
                  </span>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sunken text-xs font-semibold text-muted">
                  3
                </span>
                <span className="text-muted">
                  Bestätige oben rechts mit{" "}
                  <span className="font-medium text-white">Hinzufügen</span>
                </span>
              </li>
            </ol>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
