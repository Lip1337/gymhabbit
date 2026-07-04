import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="card flex w-full max-w-md flex-col items-center gap-4 p-8 text-center">
        <p className="text-4xl font-bold text-accent">404</p>
        <p className="text-xl font-bold text-white">Seite nicht gefunden</p>
        <p className="text-sm text-muted">
          Diese Seite oder dieser Trainingsplan existiert nicht (mehr).
        </p>
        <Link href="/" className="btn-primary">
          Zurück zur Übersicht
        </Link>
      </div>
    </div>
  );
}
