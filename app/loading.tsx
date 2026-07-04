export default function Loading() {
  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="card h-[74px] animate-pulse" />
      <div className="card h-48 animate-pulse" />
      <div className="card h-32 animate-pulse" />
    </div>
  );
}
