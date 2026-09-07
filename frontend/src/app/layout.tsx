import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

import { ThemeInit } from "@/components/theme-init";

export const metadata: Metadata = {
  title: "Weekly Report Generator",
  description: "Sign in to create and review weekly reports.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeInit />
      </head>
      <body
        className="min-h-screen bg-background antialiased"
        suppressHydrationWarning
      >
        {children}
        <Toaster
          position="top-center"
          richColors
          closeButton
          theme="system"
        />
      </body>
    </html>
  );
}
