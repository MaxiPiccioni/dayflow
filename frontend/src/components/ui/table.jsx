import { cn } from "@/lib/utils";

export function Table({ className, ...props }) {
  return <div className="overflow-x-auto"><table className={cn("w-full min-w-[620px] text-left text-sm", className)} {...props} /></div>;
}

export function TableHeader({ className, ...props }) {
  return <thead className={cn("border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-400 dark:border-zinc-700", className)} {...props} />;
}

export function TableBody(props) {
  return <tbody {...props} />;
}

export function TableRow({ className, ...props }) {
  return <tr className={cn("border-b border-zinc-100 last:border-0 dark:border-zinc-800", className)} {...props} />;
}

export function TableHead({ className, ...props }) {
  return <th className={cn("pb-3 pr-4 font-medium", className)} {...props} />;
}

export function TableCell({ className, ...props }) {
  return <td className={cn("py-3 pr-4", className)} {...props} />;
}
