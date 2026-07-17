import { CalendarDays, ReceiptText, WalletCards } from "lucide-react";
import { MetricCard } from "@/components/dashboard/metric-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ReceiptTimeline } from "@/components/dashboard/receipt-timeline";
import { SpendingStory } from "@/components/dashboard/spending-story";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <div className="mx-auto max-w-7xl space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Your personal finance companion</p><h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Good to see you.</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A calmer way to understand the habits behind your money.</p></div><QuickActions /></div><SpendingStory story={data.story} dna={data.dna} /><section className="grid gap-3 sm:grid-cols-3"><MetricCard title="Receipts remembered" value={String(data.metrics.totalReceipts)} detail="Small purchases, clearer patterns" icon={ReceiptText} /><MetricCard title="All-time tracked" value={formatCurrency(data.metrics.totalSpending)} detail="Across your receipt history" icon={WalletCards} /><MetricCard title="This month" value={formatCurrency(data.metrics.thisMonth)} detail="Your current spending rhythm" icon={CalendarDays} /></section><ReceiptTimeline receipts={data.recent} /></div>;
}
