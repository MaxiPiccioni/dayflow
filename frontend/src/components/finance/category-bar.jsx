"use client";

// Barra de distribución con leyenda (gastos por categoría y dinero en posesión).
export function CategoryBar({ data }) {
  const total = data.reduce((sum, item) => sum + item.amount, 0);
  return (
    <div className="pie-chart-in w-full min-w-0">
      <div className="flex h-9 w-full overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800">
        {data.map((item, index) => {
          const pct = total ? (item.amount / total) * 100 : 0;
          return <div key={item.category} className="bar-segment h-full" style={{ width: `${pct}%`, backgroundColor: item.color, animationDelay: `${index * 100}ms` }} title={`${item.category}: ${Math.round(pct)}%`} />;
        })}
      </div>
      <ul className="mt-4 w-full space-y-2 text-sm">
        {data.map((item, index) => (
          <li key={item.category} className="pie-legend-item flex items-center gap-2" style={{ animationDelay: `${150 + index * 100}ms` }}>
            <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="flex-1 truncate">{item.category}</span>
            <span className="text-xs text-zinc-400">{total ? Math.round((item.amount / total) * 100) : 0}%</span>
            <strong className="text-right">$ {item.amount.toLocaleString("es-AR")}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}
