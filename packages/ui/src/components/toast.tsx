"use client";
import * as React from "react";
import { cn } from "../lib/utils";

type Variant = "default" | "error" | "success";
type ToastItem = { id: string; message: string; variant: Variant };

const ToastContext = React.createContext<{
  toasts: ToastItem[];
  push: (message: string, variant?: Variant) => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((message: string, variant: Variant = "default") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);
  return (
    <ToastContext.Provider value={{ toasts, push }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4 sm:items-end sm:px-6"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.variant === "error" ? "alert" : "status"}
            className={cn(
              "pointer-events-auto w-full max-w-sm rounded-xl px-4 py-3 text-sm font-medium shadow-lg animate-in",
              t.variant === "error" && "bg-red-600 text-white",
              t.variant === "success" && "bg-emerald-700 text-white",
              t.variant === "default" && "bg-[hsl(var(--foreground))] text-[hsl(var(--background))]",
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = React.useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
