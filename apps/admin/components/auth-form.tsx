"use client";
import { useTransition } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  Input,
} from "@relay/ui";
import { useToast } from "@relay/ui";

export function AuthForm({
  title,
  description,
  action,
  fields,
  submitLabel,
}: {
  title: string;
  description?: string;
  action: (fd: FormData) => Promise<{ ok?: boolean; error?: string } | void>;
  fields: Array<{ name: string; label: string; type?: string; placeholder?: string }>;
  submitLabel: string;
}) {
  const [pending, start] = useTransition();
  const { push } = useToast();
  return (
    <Card className="animate-in shadow-sm">
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
                required
              />
            </Field>
          ))}
          <Button type="submit" className="w-full" size="lg" loading={pending}>
            {submitLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
