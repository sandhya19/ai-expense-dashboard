"use client";

import {
  ChevronDown,
  LogOut,
  Moon,
  Settings,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { signOut } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type TopNavProps = {
  fullName: string | null;
  email: string | null;
};

function getInitials(
  fullName: string | null,
  email: string | null
) {
  if (fullName) {
    const initials = fullName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase();

    if (initials) {
      return initials;
    }
  }

  if (email) {
    return email.slice(0, 2).toUpperCase();
  }

  return null;
}

export function TopNav({
  fullName,
  email,
}: TopNavProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [accountOpen, setAccountOpen] = useState(false);

  const initials = getInitials(fullName, email);
  const accountLabel = fullName ?? email ?? "Account";

  return (
    <header className="flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="ml-auto flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={() =>
            setTheme(
              resolvedTheme === "dark"
                ? "light"
                : "dark"
            )
          }
          aria-label="Toggle theme"
        >
          {resolvedTheme === "dark" ? (
            <Sun className="size-5" />
          ) : (
            <Moon className="size-5" />
          )}
        </Button>

        <div className="relative ml-2">
          <button type="button" onClick={() => setAccountOpen((open) => !open)} className="flex h-11 items-center gap-2 rounded-xl border bg-card px-2 shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-expanded={accountOpen} aria-label={`Open account menu for ${accountLabel}`}>
            <span className="grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{initials ?? <User className="size-5" />}</span>
            <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{accountLabel}</span><ChevronDown className="hidden size-4 text-muted-foreground sm:block" />
          </button>
          {accountOpen && <div className="absolute right-0 top-14 z-50 w-56 rounded-xl border bg-card p-1 shadow-xl ring-1 ring-black/5"><div className="border-b px-3 py-2"><p className="truncate text-sm font-medium">{accountLabel}</p>{email && <p className="truncate text-xs text-muted-foreground">{email}</p>}</div><Link href="/settings" onClick={() => setAccountOpen(false)} className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm hover:bg-muted"><Settings className="size-4" />Personal settings</Link><form action={signOut}><button type="submit" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"><LogOut className="size-4" />Sign out</button></form></div>}
        </div>
      </div>
    </header>
  );
}
