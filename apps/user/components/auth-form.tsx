'use client';
import { useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@relay/ui";
import { useToast } from "@relay/ui";

export function AuthForm({
  action,
  fields,
  submitLabel,
  footer,
}: {
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string }>;
  submitLabel: string;
  footer?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const { push } = useToast();
  return (
    <Card>
      <CardHeader>
        <CardTitle>{submitLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-3"
          action={(fd) =>
            start(async () => {
              const res = await action(fd);
              if (res && "ok" in res && res.ok === false) push(res.error ?? "Failed", "error");
            })
          }
        >
          {fields.map((f) => (
            <div key={f.name} className="space-y-1">
              <label className="text-sm font-medium">{f.label}</label>
              <Input name={f.name} type={f.type ?? "text"} placeholder={f.placeholder} required />
            </div>
          ))}
          <Button type="submit" className="w-full" loading={pending}>
            {submitLabel}
          </Button>
        </form>
        {footer}
      </CardContent>
    </Card>
  );
}
