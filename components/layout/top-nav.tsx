"use client";

import {
  Moon,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
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

        <Link href="/settings" className="ml-2 flex items-center gap-2 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" title={`Personal settings for ${accountLabel}`}>
        <div
          title={accountLabel}
          aria-label={accountLabel}
          className="ml-2 grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {initials ?? <User className="size-5" />}
        </div>
        <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{accountLabel}</span>
        </Link>
      </div>
    </header>
  );
}
