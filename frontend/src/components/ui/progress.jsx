export function Progress({ value, color = "bg-lime-500" }) {
  return <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800"><div className={`h-full rounded-full transition-[width] duration-700 ease-out ${color}`} style={{ width: `${Math.min(100, value)}%` }} /></div>;
}
