import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = { title: "ExpenseAI Dashboard", description: "AI receipt and expense management dashboard" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" suppressHydrationWarning><body><ThemeProvider><AppShell>{children}</AppShell></ThemeProvider></body></html>; }
