'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle } from "@relay/ui";
import { useToast } from "@relay/ui";
import { listTrustedContactsAction, addTrustedContactAction, removeTrustedContactAction } from "@/lib/actions";

export default function ContactsPage() {
  const [items, setItems] = useState<Array<{ id: string; trusted: Record<string, string> }>>([]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pending, start] = useTransition();
  const { push } = useToast();

  const load = () => start(async () => {
    const res = await listTrustedContactsAction();
    if (res.ok) setItems(res.data);
  });

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Add trusted contact</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" />
          <Input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Your password to confirm" />
          <Button className="w-full" loading={pending} onClick={() => start(async () => {
            const res = await addTrustedContactAction(username.replace(/^@/, ""), password);
            if (!res.ok) return push(res.error, "error");
            push("Contact added"); setUsername(""); setPassword(""); load();
          })}>Add</Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Trusted contacts</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {items.map((c) => (
            <div key={c.id} className="flex justify-between rounded-lg border p-3 text-sm">
              <span>@{c.trusted.username}</span>
              <Button size="sm" variant="outline" onClick={() => start(async () => { await removeTrustedContactAction(c.id); load(); })}>Remove</Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
