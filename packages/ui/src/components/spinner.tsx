import { cn } from "../lib/utils";

export function Spinner({ className, label = "Loading" }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        "inline-block size-4 shrink-0 rounded-full border-2 border-current border-r-transparent animate-[spin_0.7s_linear_infinite]",
        className,
      )}
    />
  );
}
