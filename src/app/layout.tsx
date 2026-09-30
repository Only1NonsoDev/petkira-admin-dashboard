import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { Shell } from "@/components/Shell";
import { ToastProvider } from "@/components/ui";

export const metadata: Metadata = {
  title: "PetKira Admin (local)",
  robots: { index: false, follow: false },
  icons: { icon: "/petkira-k.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
      </head>
      <body>
        <AuthProvider>
          <ToastProvider>
            <Shell>{children}</Shell>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
