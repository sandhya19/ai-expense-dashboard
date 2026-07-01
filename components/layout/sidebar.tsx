"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BarChart3, Bot, FileText, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Receipt, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";


const items = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Documents", icon: FileText },
  { href: "/ai-chat", label: "AI Chat", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings }
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  return <aside className={cn("hidden border-r bg-card transition-[width] duration-200 md:flex md:flex-col", collapsed ? "w-20" : "w-64")}>
    <div className="flex h-16 items-center gap-3 border-b px-4">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Receipt className="size-5" /></span>
      {!collapsed && <span className="font-semibold">ExpenseAI</span>}
    </div>
    <nav className="flex-1 space-y-1 p-3">
      {items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={cn("flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground", pathname === href && "bg-accent text-foreground", collapsed && "justify-center px-0")} title={collapsed ? label : undefined}>
        <Icon className="size-5 shrink-0" />{!collapsed && label}
      </Link>)}
    </nav>
    <div className="border-t p-3"><Button variant="ghost" className={cn("w-full", collapsed ? "px-0" : "justify-start")} onClick={() => setCollapsed((value) => !value)}>{collapsed ? <PanelLeftOpen className="size-5" /> : <><PanelLeftClose className="size-5" /> Collapse</>}</Button></div>
    <SignOutButton />
  </aside>;
}
