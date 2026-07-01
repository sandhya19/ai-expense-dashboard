"use client";

import {
  Bell,
  Menu,
  Moon,
  Search,
  Sun,
  User,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        aria-label="Open menu"
      >
        <Menu className="size-5" />
      </Button>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          className="pl-9"
          placeholder="Search receipts, merchants, categories..."
        />
      </div>

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

        <Button
          variant="ghost"
          size="icon"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </Button>

        <div
          title={accountLabel}
          aria-label={accountLabel}
          className="ml-2 grid size-9 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
        >
          {initials ?? <User className="size-5" />}
        </div>
      </div>
    </header>
  );
}