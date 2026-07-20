import { BrainCircuit, Compass, Sparkles } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { SpendingDnaHistoryPoint } from "@/lib/spending-dna-history";
import type { SpendingDnaTrait } from "@/lib/types";

const traitGuidance: Record<string, string> = {
  "coffee-explorer": "Your everyday rituals are showing up. A few intentional swaps can create room without taking away the joy.",
  "food-lover": "Meals and groceries are a meaningful part of your month. Notice the places that feel most worth it to you.",
  traveller: "You spend to get places and make plans happen. Compare routes or booking windows when you want more flexibility.",
  "smart-shopper": "You notice value signals. Keep an eye on repeat shops so savings stay useful, not just frequent.",
};

function historyScore(point: SpendingDnaHistoryPoint, traitId: string) {
  return point.traits.find((trait) => trait.id === traitId)?.score ?? 0;
}

export function SpendingDnaProfile({
  dna,
  history,
  receiptCount,
}: {
  dna: SpendingDnaTrait[];
  history: SpendingDnaHistoryPoint[];
  receiptCount: number;
}) {
  if (receiptCount === 0) {
    return <Card className="border-dashed"><CardContent className="grid min-h-72 place-items-center p-6 text-center"><div><BrainCircuit className="mx-auto size-10 text-muted-foreground" /><h2 className="mt-4 text-xl font-semibold">Your Spending DNA is waiting for its first clue.</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">Upload a few receipts and ReceiptBrain will turn your everyday choices into a calm, explainable profile.</p></div></CardContent></Card>;
  }

  return <div className="space-y-6">
    <section className="grid gap-4 lg:grid-cols-2">
      {dna.map((trait) => <Card key={trait.id}><CardContent className="p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">{trait.label}</p><h2 className="mt-1 text-2xl font-semibold tracking-tight">{trait.score}% present</h2><p className="mt-2 text-sm text-muted-foreground">{trait.description}</p></div><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-5" /></span></div><div className="mt-6 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-violet-400 transition-all" style={{ width: `${trait.score}%` }} /></div><p className="mt-5 text-sm leading-6 text-muted-foreground">{traitGuidance[trait.id]}</p></CardContent></Card>)}
    </section>

    <Card><CardContent className="p-6"><div className="flex items-start gap-3"><span className="grid size-10 place-items-center rounded-xl bg-violet-500/10 text-violet-700"><Compass className="size-5" /></span><div><p className="text-sm font-medium text-primary">Your profile over time</p><h2 className="mt-1 text-xl font-semibold tracking-tight">The patterns building behind your spending</h2><p className="mt-1 text-sm text-muted-foreground">Scores are recalculated from every receipt recorded up to each month.</p></div></div><div className="mt-7 space-y-6">{dna.map((trait) => <div key={trait.id}><div className="mb-2 flex items-center justify-between"><p className="text-sm font-medium">{trait.label}</p><p className="text-xs text-muted-foreground">Current {trait.score}%</p></div><div className="grid h-20 items-end gap-2" style={{ gridTemplateColumns: `repeat(${history.length}, minmax(0, 1fr))` }}>{history.map((point) => { const value = historyScore(point, trait.id); return <div key={point.label} className="flex h-full flex-col justify-end gap-1"><div className="rounded-t-md bg-gradient-to-t from-primary to-violet-400" style={{ height: `${Math.max(value, 4)}%` }} title={`${point.label}: ${value}%`} /><span className="text-center text-[10px] text-muted-foreground">{point.label}</span></div>; })}</div></div>)}</div></CardContent></Card>
  </div>;
}
