'use client';
import { useEffect, useState, useTransition } from "react";
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from "@relay/ui";
import { useToast } from "@relay/ui";
import { getMeAction, verifyEmailAction, verifyPhoneAction, resendOtpAction } from "@/lib/actions";

export default function VerifyPage() {
  const [status, setStatus] = useState<string>("PENDING_EMAIL");
  const [pending, start] = useTransition();
  const { push } = useToast();

  useEffect(() => {
    void getMeAction().then((res) => {
      if (res.ok) setStatus(res.data.user.status as string);
    });
  }, []);

  const channel = status === "PENDING_PHONE" ? "phone" : "email";

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center p-4">
      <Card>
        <CardHeader>
          <CardTitle>Verify your {channel}</CardTitle>
          <CardDescription>
            Check Notifications for your OTP code (also logged in API console). Resend if needed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form
            action={(fd) =>
              start(async () => {
                const fn = status === "PENDING_PHONE" ? verifyPhoneAction : verifyEmailAction;
                const res = await fn(fd);
                if (!res.ok) push(res.error, "error");
                else {
                  push("Verified!");
                  if (status === "PENDING_EMAIL") setStatus("PENDING_PHONE");
                }
              })
            }
          >
            <Input name="code" placeholder="6-digit code" maxLength={6} required className="mb-3" />
            <Button type="submit" className="w-full" loading={pending}>
              Verify
            </Button>
          </form>
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              start(async () => {
                const res = await resendOtpAction();
                if (res.ok) push(`OTP sent via ${res.data.channel}. Check Notifications.`);
                else push(res.error, "error");
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
