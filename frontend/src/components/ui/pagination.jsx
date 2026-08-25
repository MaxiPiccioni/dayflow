import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

function pageList(current, total) {
  const pages = [1];
  for (let page = current - 1; page <= current + 1; page++) if (page > 1 && page < total) pages.push(page);
  if (total > 1) pages.push(total);
  return [...new Set(pages)].sort((a, b) => a - b);
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  const pages = pageList(page, totalPages);
  return (
    <nav className="flex items-center gap-1" aria-label="Paginación">
      <button type="button" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1} aria-label="Página anterior" className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:hover:bg-zinc-800">
        <ChevronLeft size={15} />
      </button>
      {pages.map((item, index) => {
        const previous = pages[index - 1];
        const gap = previous !== undefined && item - previous > 1;
        return (
          <span key={item} className="flex items-center gap-1">
            {gap && <span className="px-1 text-xs text-zinc-400">…</span>}
            <button type="button" onClick={() => onChange(item)} aria-current={item === page ? "page" : undefined} className={cn("h-8 min-w-8 rounded-lg px-2 text-xs font-medium", item === page ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900" : "border border-zinc-200 hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800")}>
              {item}
            </button>
          </span>
        );
      })}
      <button type="button" onClick={() => onChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} aria-label="Página siguiente" className="grid h-8 w-8 place-items-center rounded-lg border border-zinc-200 hover:bg-zinc-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-zinc-700 dark:hover:bg-zinc-800">
        <ChevronRight size={15} />
      </button>
    </nav>
  );
}
