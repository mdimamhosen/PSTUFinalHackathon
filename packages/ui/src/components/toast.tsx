"use client";
import * as React from "react";
import { cn } from "../lib/utils";

type ToastItem = { id: string; message: string; variant?: "default" | "error" };

const ToastContext = React.createContext<{
  toasts: ToastItem[];
  push: (message: string, variant?: "default" | "error") => void;
} | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);
  const push = React.useCallback((message: string, variant: "default" | "error" = "default") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, message, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);
  return (
    <ToastContext.Provider value={{ toasts, push }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg px-4 py-3 text-sm shadow-lg",
              t.variant === "error" ? "bg-red-600 text-white" : "bg-slate-900 text-white",
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
