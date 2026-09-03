import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Weekly Report Generator",
  description: "Sign in to create and review weekly reports.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-background antialiased"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
