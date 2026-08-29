"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { cn } from "../lib/utils";
import { Button } from "./button";

type AlertOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  variant?: "info" | "success" | "warning" | "error";
};

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

type ModalContextValue = {
  alert: (options: AlertOptions) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ModalContext = React.createContext<ModalContextValue | null>(null);

type StackItem =
  | { kind: "alert"; id: string; options: AlertOptions; resolve: () => void }
  | {
      kind: "confirm";
      id: string;
      options: ConfirmOptions;
      resolve: (value: boolean) => void;
    };

export function ModalProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = React.useState<StackItem[]>([]);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  const alert = React.useCallback((options: AlertOptions) => {
    return new Promise<void>((resolve) => {
      setStack((s) => [...s, { kind: "alert", id: crypto.randomUUID(), options, resolve }]);
    });
  }, []);

  const confirm = React.useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setStack((s) => [...s, { kind: "confirm", id: crypto.randomUUID(), options, resolve }]);
    });
  }, []);

  const top = stack[stack.length - 1];

  const closeAlert = () => {
    if (!top || top.kind !== "alert") return;
    top.resolve();
    setStack((s) => s.slice(0, -1));
  };

  const closeConfirm = (value: boolean) => {
    if (!top || top.kind !== "confirm") return;
    top.resolve(value);
    setStack((s) => s.slice(0, -1));
  };

  React.useEffect(() => {
    if (!top) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (top.kind === "alert") closeAlert();
        else closeConfirm(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [top]);

  return (
    <ModalContext.Provider value={{ alert, confirm }}>
      {children}
      {mounted && top
        ? createPortal(
            <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
              <button
                type="button"
                className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade"
                aria-label="Close dialog"
                onClick={() => (top.kind === "alert" ? closeAlert() : closeConfirm(false))}
              />
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={`modal-title-${top.id}`}
                className="relative z-10 w-full max-w-md animate-in rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xl"
              >
                <h2 id={`modal-title-${top.id}`} className="text-lg font-bold tracking-tight">
                  {top.options.title}
                </h2>
                {top.options.description ? (
                  <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">
                    {top.options.description}
                  </p>
                ) : null}
                {top.kind === "alert" ? (
                  <div className="mt-5 flex justify-end">
                    <Button
                      onClick={closeAlert}
                      variant={
                        top.options.variant === "error"
                          ? "destructive"
                          : top.options.variant === "success"
                            ? "success"
                            : "default"
                      }
                    >
                      {top.options.confirmLabel ?? "OK"}
                    </Button>
                  </div>
                ) : (
                  <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => closeConfirm(false)}>
                      {top.options.cancelLabel ?? "Cancel"}
                    </Button>
                    <Button
                      variant={top.options.destructive ? "destructive" : "default"}
                      onClick={() => closeConfirm(true)}
                    >
                      {top.options.confirmLabel ?? "Confirm"}
                    </Button>
                  </div>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </ModalContext.Provider>
  );
}

export function useModal() {
  const ctx = React.useContext(ModalContext);
  if (!ctx) throw new Error("useModal must be used within ModalProvider");
  return ctx;
}

export function Dialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/45 backdrop-blur-[2px] animate-fade"
        aria-label="Close dialog"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative z-10 w-full max-w-md animate-in rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5 shadow-xl",
          className,
        )}
      >
        <h2 className="text-lg font-bold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-2 text-sm text-[hsl(var(--muted-foreground))]">{description}</p>
        ) : null}
        {children ? <div className="mt-4">{children}</div> : null}
        {footer ? <div className="mt-5">{footer}</div> : null}
      </div>
    </div>,
    document.body,
  );
}
