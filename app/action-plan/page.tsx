import { WeeklyFinancialPlan } from "@/components/dashboard/weekly-financial-plan";
import { getReceiptList } from "@/lib/receipts";

export default async function ActionPlanPage() {
  const receipts = await getReceiptList();
  return <div className="mx-auto max-w-3xl space-y-6"><div><p className="text-sm font-medium text-primary">OpenAI Build Week extension</p><h1 className="mt-1 text-3xl font-semibold tracking-tight">One useful action for your week</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">ReceiptBrain asks GPT-5.6 for a focused, evidence-backed suggestion based only on your receipt memory.</p></div><WeeklyFinancialPlan receiptCount={receipts.length} /></div>;
}
