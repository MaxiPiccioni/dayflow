import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return <input className={cn("w-full rounded-xl border border-zinc-200 bg-transparent px-3 py-2 text-sm outline-none focus:border-lime-500 dark:border-zinc-700", className)} {...props} />;
}
