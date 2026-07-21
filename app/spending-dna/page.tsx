import { BrainCircuit } from "lucide-react";
import { SpendingDnaProfile } from "@/components/dashboard/spending-dna-profile";
import { getSpendingDnaProfile } from "@/lib/dashboard";
import { buildSpendingDnaHistory } from "@/lib/spending-dna-history";

export default async function SpendingDnaPage({ searchParams }: { searchParams: Promise<{ demo?: string }> }) {
  const demoMode = (await searchParams).demo === "1";
  const profile = await getSpendingDnaProfile(demoMode);
  const history = buildSpendingDnaHistory(profile.receipts);

  return <div className="mx-auto max-w-6xl space-y-7"><div className="flex items-start gap-4"><span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary"><BrainCircuit className="size-6" /></span><div><p className="text-sm font-medium text-primary">Personal intelligence</p><h1 className="mt-1 text-3xl font-semibold tracking-tight md:text-4xl">Your Spending DNA</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">A quiet profile of the habits behind your receipts—designed to guide, never judge.</p></div></div><SpendingDnaProfile dna={profile.dna} history={history} receiptCount={profile.receipts.length} /></div>;
}
