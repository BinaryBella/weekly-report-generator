"use client";

import { useEffect, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

import { cn } from "@/lib/utils";

type Theme = "system" | "light" | "dark";

const STORAGE_KEY = "wrg-theme";

const OPTIONS: { value: Theme; label: string; Icon: typeof Monitor }[] = [
  { value: "system", label: "System", Icon: Monitor },
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
];

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

/** Toggle the `dark` class on <html> to match the requested theme. */
function applyTheme(theme: Theme): void {
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

export function ThemePreference() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  // Load the stored choice once, on the client.
  useEffect(() => {
    let stored: Theme = "system";
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === "light" || raw === "dark" || raw === "system") stored = raw;
    } catch {
      /* storage unavailable — fall back to system */
    }
    setTheme(stored);
    setMounted(true);
  }, []);

  // Keep "system" live when the OS preference changes.
  useEffect(() => {
    if (!mounted) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (theme === "system") applyTheme("system");
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [mounted, theme]);

  function choose(next: Theme) {
    setTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* best effort — the class is still applied for this session */
    }
    applyTheme(next);
  }

  return (
    <div
      role="radiogroup"
      aria-label="Theme"
      className="inline-flex rounded-md border border-input bg-background p-1"
    >
      {OPTIONS.map(({ value, label, Icon }) => {
        const active = mounted && theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => choose(value)}
            className={cn(
              "inline-flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
