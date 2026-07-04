"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="card flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <p className="text-xl font-bold text-white">Etwas ist schiefgelaufen</p>
        <p className="break-all text-sm text-muted">
          {error.message || "Unbekannter Fehler."}
        </p>
        <button onClick={reset} className="btn-primary">
          Erneut versuchen
        </button>
      </div>
    </div>
  );
}
