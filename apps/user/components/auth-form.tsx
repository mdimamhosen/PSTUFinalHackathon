"use client";
import { useTransition } from "react";
import { Button, Field, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@relay/ui";
import { useToast } from "@relay/ui";

export function AuthForm({
  title,
  description,
  action,
  fields,
  submitLabel,
  footer,
}: {
  title: string;
  description?: string;
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string; autoComplete?: string }>;
  submitLabel: string;
  footer?: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  const { push } = useToast();
  return (
    <Card className="animate-in shadow-soft">
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        <form
          className="space-y-4"
          action={(fd) =>
            start(async () => {
              const res = await action(fd);
              if (res && "ok" in res && res.ok === false) push(res.error ?? "Failed", "error");
            })
          }
        >
          {fields.map((f) => (
            <Field key={f.name} label={f.label} htmlFor={f.name}>
              <Input
                id={f.name}
                name={f.name}
                type={f.type ?? "text"}
                placeholder={f.placeholder}
                autoComplete={f.autoComplete}
                required
              />
            </Field>
          ))}
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            {submitLabel}
          </Button>
        </form>
        {footer}
      </CardContent>
    </Card>
  );
}
