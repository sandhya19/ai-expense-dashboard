"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Bot, BrainCircuit, FileText, LayoutDashboard, PanelLeftClose, PanelLeftOpen, Receipt, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/auth/sign-out-button";


const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/documents", label: "Receipt timeline", icon: FileText },
  { href: "/spending-dna", label: "Spending DNA", icon: BrainCircuit },
  { href: "/spending-story", label: "Spending Story", icon: Sparkles },
  { href: "/ai-chat", label: "AI Chat", icon: Bot },
  { href: "/settings", label: "Personal settings", icon: Settings }
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  return <aside className={cn("hidden border-r bg-card transition-[width] duration-200 md:flex md:flex-col", collapsed ? "w-20" : "w-64")}>
    <div className="flex h-16 items-center gap-3 border-b px-4">
      <span className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground"><Receipt className="size-5" /></span>
      {!collapsed && <span className="font-semibold">ReceiptBrain</span>}
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
