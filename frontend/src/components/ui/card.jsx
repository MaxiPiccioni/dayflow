export function Card({ className = "", children }) {
  return <section className={`rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-sm transition-colors duration-300 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 ${className}`}>{children}</section>;
}

export function CardHeader({ title, eyebrow, action }) {
  return <div className="mb-5 flex flex-wrap items-start justify-between gap-x-4 gap-y-3"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">{eyebrow}</p><h2 className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-100">{title}</h2></div>{action}</div>;
}
