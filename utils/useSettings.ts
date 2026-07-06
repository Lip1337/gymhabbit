"use client";

import { useCallback, useSyncExternalStore } from "react";
import {
  AppSettings,
  DEFAULT_SETTINGS,
  SETTINGS_COOKIE,
  parseSettings,
} from "./settings";

// Kleiner externer Store rund um das Einstellungs-Cookie. Über useSyncExternalStore
// bleiben alle Consumer synchron und es gibt keine Hydration-Mismatches.
let cached: AppSettings | null = null;
const listeners = new Set<() => void>();

function readSettingsCookie(): AppSettings {
  if (typeof document === "undefined") return DEFAULT_SETTINGS;
  const entry = document.cookie
    .split("; ")
    .find((c) => c.startsWith(`${SETTINGS_COOKIE}=`));
  if (!entry) return DEFAULT_SETTINGS;
  return parseSettings(decodeURIComponent(entry.split("=").slice(1).join("=")));
}

function getSnapshot(): AppSettings {
  if (cached === null) cached = readSettingsCookie();
  return cached;
}

function getServerSnapshot(): AppSettings {
  return DEFAULT_SETTINGS;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function writeSettingsCookie(settings: AppSettings) {
  const value = encodeURIComponent(JSON.stringify(settings));
  // 1 Jahr gültig, für alle Pfade.
  document.cookie = `${SETTINGS_COOKIE}=${value}; path=/; max-age=31536000; SameSite=Lax`;
  cached = settings;
  listeners.forEach((listener) => listener());
}

export function useSettings() {
  const settings = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const update = useCallback((patch: Partial<AppSettings>) => {
    writeSettingsCookie({ ...getSnapshot(), ...patch });
  }, []);

  return { settings, update };
}
