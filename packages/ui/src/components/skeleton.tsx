import { cn } from "../lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-xl bg-gradient-to-r from-[hsl(var(--muted))] via-[hsl(var(--secondary))] to-[hsl(var(--muted))] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
