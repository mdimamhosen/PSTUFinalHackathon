import "@relay/ui/globals.css";
import type { Metadata } from "next";
import { ToastProvider } from "@relay/ui";

export const metadata: Metadata = { title: "Relay", description: "P2P wallet" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
