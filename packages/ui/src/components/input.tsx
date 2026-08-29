"use client";
import * as React from "react";
import { cn } from "../lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, invalid, ...props }, ref) => (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        "flex h-11 w-full rounded-xl border bg-[hsl(var(--card))] px-3.5 py-2 text-sm shadow-sm transition",
        "placeholder:text-[hsl(var(--muted-foreground))]",
        "hover:border-[hsl(var(--muted-foreground))]/30",
        "focus-visible:border-[hsl(var(--ring))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]/25",
        "disabled:cursor-not-allowed disabled:opacity-50",
        invalid && "border-[hsl(var(--destructive))] focus-visible:ring-[hsl(var(--destructive))]/25",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
