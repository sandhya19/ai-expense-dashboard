import { ArrowDownRight, ArrowUpRight, BrainCircuit, Lightbulb, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import type { SpendingDnaTrait, SpendingStory } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const impactStyles = {
  low: "bg-sky-500/10 text-sky-700 dark:text-sky-300",
  medium: "bg-violet-500/10 text-violet-700 dark:text-violet-300",
  high: "bg-amber-500/10 text-amber-800 dark:text-amber-300",
};

export function SpendingStory({ story, dna, demoMode = false }: { story: SpendingStory; dna: SpendingDnaTrait[]; demoMode?: boolean }) {
  const isUp = (story.changePercent ?? 0) >= 0;
  const demoQuery = demoMode ? "?demo=1" : "";

  return (
    <section className="grid gap-4 xl:grid-cols-12">
      <Link href={`/spending-story${demoQuery}`} className="group xl:col-span-7">
      <Card className="h-full overflow-hidden border-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-900 text-white shadow-xl transition-transform group-hover:-translate-y-0.5">
        <CardContent className="relative p-6 sm:p-8">
          <div className="absolute -right-16 -top-20 size-64 rounded-full bg-fuchsia-400/20 blur-3xl" />
          <div className="absolute -bottom-20 left-20 size-52 rounded-full bg-cyan-300/15 blur-3xl" />
          <div className="relative">
            <div className="flex items-center gap-2 text-sm font-medium text-indigo-100"><Sparkles className="size-4" /> Your {story.periodLabel} spending story</div>
            <p className="mt-8 text-sm text-indigo-100">Tracked spending</p>
            <div className="mt-1 flex flex-wrap items-end gap-x-4 gap-y-2"><p className="text-4xl font-semibold tracking-tight sm:text-5xl">{formatCurrency(story.total)}</p>{story.changePercent !== null && <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-sm font-medium text-white">{isUp ? <ArrowUpRight className="size-4" /> : <ArrowDownRight className="size-4" />}{Math.abs(story.changePercent)}% vs last month</span>}</div>
            <p className="mt-5 max-w-lg text-sm leading-6 text-indigo-100">This is a living picture, not a scorecard. ReceiptBrain notices the patterns that help you make your next choice with more clarity.</p>
          </div>
        </CardContent>
      </Card>
      </Link>

      <Link href={`/spending-dna${demoQuery}`} className="group xl:col-span-5">
      <Card className="h-full transition-all group-hover:-translate-y-0.5 group-hover:shadow-md">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><BrainCircuit className="size-5 text-primary" /><div><h2 className="font-semibold">Your Spending DNA</h2><p className="text-sm text-muted-foreground">A profile that grows with your receipts.</p></div></div><ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></div>
          <div className="mt-6 space-y-4">
            {dna.map((trait) => <div key={trait.id}><div className="mb-1.5 flex items-baseline justify-between gap-3"><div><p className="text-sm font-medium">{trait.label}</p><p className="text-xs text-muted-foreground">{trait.description}</p></div><span className="text-sm font-semibold tabular-nums">{trait.score}%</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all" style={{ width: `${trait.score}%` }} /></div></div>)}
          </div>
        </CardContent>
      </Card>
      </Link>

      <div className="grid gap-3 md:grid-cols-2 xl:col-span-12 xl:grid-cols-3">
        {story.insights.map((insight) => <Card key={insight.id} className="group transition-transform duration-200 hover:-translate-y-0.5 hover:shadow-md"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Lightbulb className="size-5" /></span><span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", impactStyles[insight.impact])}>{insight.impact} impact</span></div><h2 className="mt-4 font-semibold tracking-tight">{insight.title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.description}</p><p className="mt-4 text-sm font-medium">{insight.supporting_data}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{insight.recommendation}</p></CardContent></Card>)}
      </div>
    </section>
  );
}
