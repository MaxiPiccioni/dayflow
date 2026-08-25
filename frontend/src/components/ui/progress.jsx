export function Progress({ value, color = "bg-lime-500", segments = 1 }) {
  return (
    <div className="relative h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      <div className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`} style={{ width: `${Math.min(100, value)}%` }} />
      {segments > 1 && Array.from({ length: segments - 1 }, (_, index) => <span key={index} className="absolute top-0 h-full w-px bg-white/70 dark:bg-zinc-950/70" style={{ left: `${((index + 1) / segments) * 100}%` }} />)}
    </div>
  );
}
