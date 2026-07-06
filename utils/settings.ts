// Zentrale App-Einstellungen. Werden als JSON in einem Cookie gespeichert,
// damit sie sowohl in Client- als auch in Server-Komponenten lesbar sind.

export type WeightUnit = "kg" | "lbs";

export type AppSettings = {
  showHistory: boolean;
  historyLimit: number;
  unit: WeightUnit;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
};

export const SETTINGS_COOKIE = "gymhabbit_settings";

export const DEFAULT_SETTINGS: AppSettings = {
  showHistory: true,
  historyLimit: 5,
  unit: "kg",
  defaultSets: 3,
  defaultReps: 10,
  defaultWeight: 20,
};

export const HISTORY_LIMIT_OPTIONS = [5, 10, 20, 50] as const;

function toInt(value: unknown, fallback: number): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export function parseSettings(raw: string | undefined | null): AppSettings {
  if (!raw) return DEFAULT_SETTINGS;
  try {
    const p = JSON.parse(raw) as Partial<AppSettings>;
    return {
      showHistory:
        typeof p.showHistory === "boolean"
          ? p.showHistory
          : DEFAULT_SETTINGS.showHistory,
      historyLimit: Math.min(
        100,
        Math.max(1, toInt(p.historyLimit, DEFAULT_SETTINGS.historyLimit)),
      ),
      unit: p.unit === "lbs" ? "lbs" : "kg",
      defaultSets: Math.max(0, toInt(p.defaultSets, DEFAULT_SETTINGS.defaultSets)),
      defaultReps: Math.max(0, toInt(p.defaultReps, DEFAULT_SETTINGS.defaultReps)),
      defaultWeight: Math.max(
        0,
        toInt(p.defaultWeight, DEFAULT_SETTINGS.defaultWeight),
      ),
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
