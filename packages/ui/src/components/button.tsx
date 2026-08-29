"use client";
import * as React from "react";
import { cn } from "../lib/utils";
import { Spinner } from "./spinner";

type Variant = "default" | "secondary" | "outline" | "ghost" | "destructive" | "success";
type Size = "default" | "sm" | "lg" | "icon";

const variants: Record<Variant, string> = {
  default:
    "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow-sm hover:brightness-110 active:brightness-95",
  secondary:
    "bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--accent))]",
  outline:
    "border border-[hsl(var(--border))] bg-[hsl(var(--card))]/80 backdrop-blur-sm hover:bg-[hsl(var(--muted))]",
  ghost: "hover:bg-[hsl(var(--muted))] text-[hsl(var(--foreground))]",
  destructive:
    "bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))] hover:brightness-110",
  success: "bg-[hsl(var(--success))] text-[hsl(var(--success-foreground))] hover:brightness-110",
};

const sizes: Record<Size, string> = {
  default: "h-11 px-4 text-sm",
  sm: "h-9 rounded-lg px-3 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
  icon: "size-11",
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  className,
  variant = "default",
  size = "default",
  loading,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold tracking-tight transition-all duration-150",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading ? <Spinner className="opacity-90" /> : null}
      {children}
    </button>
  );
}
