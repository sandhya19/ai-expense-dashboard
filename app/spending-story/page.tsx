import { Sparkles } from "lucide-react";
import { MonthlyStoryShare } from "@/components/dashboard/monthly-story-share";
import { getDashboardData } from "@/lib/dashboard";

export default async function SpendingStoryPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demoMode = (await searchParams).demo === "1";
  const { story } = await getDashboardData(demoMode);
  return <div className="mx-auto max-w-5xl space-y-7"><div className="flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-700"><Sparkles className="size-6" /></span><div><p className="text-sm font-medium text-primary">Monthly reflection</p><h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Spending Story</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A private, shareable snapshot of the patterns your receipts uncovered this month.</p></div></div><MonthlyStoryShare story={story} /></div>;
}
