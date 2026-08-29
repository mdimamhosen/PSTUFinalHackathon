"use client";
import { useEffect, useState, useTransition } from "react";
import {
  Alert,
  BrandMark,
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
import { getMeAction, verifyEmailAction, verifyPhoneAction, resendOtpAction } from "@/lib/actions";
import { useRouter } from "next/navigation";

export default function VerifyPage() {
  const [status, setStatus] = useState<string>("PENDING_EMAIL");
  const [pending, start] = useTransition();
  const { push } = useToast();
  const router = useRouter();

  useEffect(() => {
    void getMeAction().then((res) => {
      if (res.ok) {
        const s = res.data.user.status as string;
        setStatus(s);
        if (s === "ACTIVE") router.replace("/dashboard");
      }
    });
  }, [router]);

  const channel = status === "PENDING_PHONE" ? "phone" : "email";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 p-4">
      <div className="flex justify-center">
        <BrandMark />
      </div>
      <Card className="animate-in shadow-soft">
        <CardHeader>
          <CardTitle className="text-lg">Verify your {channel}</CardTitle>
          <CardDescription>
            Enter the 6-digit code we sent. In local dev, check Notifications if SMTP/SMS is delayed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info" title={channel === "email" ? "Step 1 of 2" : "Step 2 of 2"}>
            {channel === "email"
              ? "Confirm email first, then we will send a phone code."
              : "Almost done — verify phone to activate your wallet."}
          </Alert>
          <form
            className="space-y-4"
            action={(fd) =>
              start(async () => {
                const fn = status === "PENDING_PHONE" ? verifyPhoneAction : verifyEmailAction;
                const res = await fn(fd);
                if (!res.ok) return push(res.error, "error");
                push("Verified", "success");
                if (status === "PENDING_EMAIL") setStatus("PENDING_PHONE");
                else router.replace("/dashboard");
              })
            }
          >
            <Field label="Verification code" htmlFor="code">
              <Input
                id="code"
                name="code"
                placeholder="000000"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-lg tracking-[0.35em] font-mono"
                required
              />
            </Field>
            <Button type="submit" className="w-full" size="lg" loading={pending}>
              Verify {channel}
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            loading={pending}
            onClick={() =>
              start(async () => {
                const res = await resendOtpAction();
                if (res.ok) {
                  const data = res.data as { channel: string };
                  push(`Code resent via ${data.channel}`, "success");
                } else push(res.error, "error");
              })
            }
          >
            Resend code
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
