"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Field,
  Input,
  PageHeader,
  Skeleton,
  useModal,
  useToast,
} from "@relay/ui";
import {
  listTrustedContactsAction,
  addTrustedContactAction,
  removeTrustedContactAction,
} from "@/lib/actions";

export default function ContactsPage() {
  const [items, setItems] = useState<Array<{ id: string; trusted: Record<string, string> }>>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const { push } = useToast();
  const { confirm } = useModal();

  const load = () =>
    start(async () => {
      const res = await listTrustedContactsAction();
      if (res.ok) setItems(res.data);
      setLoaded(true);
    });

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-4 animate-in">
      <PageHeader title="Trusted contacts" description="People you can pay faster" />
      <Card>
        <CardHeader>
          <CardTitle>Add trusted contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Username" htmlFor="tc-user">
            <Input
              id="tc-user"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="@karim"
            />
          </Field>
          <Field label="Your password" htmlFor="tc-pass">
            <Input
              id="tc-pass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Confirm with your password"
            />
          </Field>
          <Button
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await addTrustedContactAction(username.replace(/^@/, ""), password);
                if (!res.ok) return push(res.error, "error");
                push("Contact added", "success");
                setUsername("");
                setPassword("");
                load();
              })
            }
          >
            Add
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Your contacts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {pending && !loaded ? (
            <div className="space-y-2" aria-busy="true">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : null}
          {items.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border p-3 text-sm"
            >
              <span>@{c.trusted.username}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  start(async () => {
                    const ok = await confirm({
                      title: "Remove trusted contact?",
                      description: `@${c.trusted.username} will be removed from your list.`,
                      confirmLabel: "Remove",
                      destructive: true,
                    });
                    if (!ok) return;
                    await removeTrustedContactAction(c.id);
                    push("Contact removed");
                    load();
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
          {loaded && !items.length ? (
            <EmptyState title="No contacts yet" description="Add someone you trust to pay often." />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
