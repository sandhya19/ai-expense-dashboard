import { CalendarDays, ReceiptText, Sparkles, WalletCards } from "lucide-react";
import Link from "next/link";
import { MetricCard } from "@/components/dashboard/metric-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ReceiptTimeline } from "@/components/dashboard/receipt-timeline";
import { SpendingStory } from "@/components/dashboard/spending-story";
import { Button } from "@/components/ui/button";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demoMode = (await searchParams).demo === "1";
  const data = await getDashboardData(demoMode);

  return <div className="mx-auto max-w-7xl space-y-6">
    {demoMode && <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex gap-3"><Sparkles className="mt-0.5 size-5 shrink-0 text-primary" /><div><p className="font-medium">Demo Mode — fictional sample data</p><p className="mt-1 text-sm text-muted-foreground">Explore a complete receipt-to-guidance journey. Nothing here belongs to you or can change your data.</p></div></div><Button variant="outline" size="sm" asChild><Link href="/">Exit demo</Link></Button></div>}
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-medium text-primary">Your personal finance companion</p><h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">{demoMode ? "A week in ReceiptBrain." : "Good to see you."}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A calmer way to understand the habits behind your money.</p></div>{demoMode ? <div className="flex flex-wrap gap-2"><Button variant="outline" asChild><Link href="/documents?demo=1">Sample receipts</Link></Button><Button variant="outline" asChild><Link href="/ai-chat?demo=1">Ask sample data</Link></Button></div> : <QuickActions />}</div>
    <SpendingStory story={data.story} dna={data.dna} demoMode={demoMode} />
    <section className="grid gap-3 sm:grid-cols-3"><MetricCard title="Receipts remembered" value={String(data.metrics.totalReceipts)} detail="Small purchases, clearer patterns" icon={ReceiptText} /><MetricCard title="All-time tracked" value={formatCurrency(data.metrics.totalSpending)} detail="Across your receipt history" icon={WalletCards} /><MetricCard title="This month" value={formatCurrency(data.metrics.thisMonth)} detail="Your current spending rhythm" icon={CalendarDays} /></section>
    <ReceiptTimeline receipts={data.recent} demoMode={demoMode} />
  </div>;
}
