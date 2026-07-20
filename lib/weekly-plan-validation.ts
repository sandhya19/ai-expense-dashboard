import { z } from "zod";
import type { ReceiptListItem } from "@/lib/receipts";
import { formatCurrency } from "@/lib/utils";

const actionPlanSchema = z.object({
  headline: z.string().trim().min(1).max(100),
  insight: z.string().trim().min(1).max(400),
  action: z.string().trim().min(1).max(300),
  evidenceReceiptIds: z.array(z.string().trim().min(1)).min(1).max(4),
});

type OpenAiActionPlan = z.infer<typeof actionPlanSchema>;

export type WeeklyFinancialPlan = Omit<OpenAiActionPlan, "evidenceReceiptIds"> & {
  citations: Array<{ id: string; label: string; detail: string }>;
};

export function parseWeeklyFinancialPlan(content: string, receipts: ReceiptListItem[]): WeeklyFinancialPlan | null {
  let json: unknown;
  try {
    json = JSON.parse(content);
  } catch {
    return null;
  }

  const parsed = actionPlanSchema.safeParse(json);
  if (!parsed.success) return null;

  const receiptsById = new Map(receipts.map((receipt) => [receipt.id, receipt]));
  const citations = parsed.data.evidenceReceiptIds.map((id) => {
    const receipt = receiptsById.get(id);
    if (!receipt) return null;
    return { id: receipt.id, label: receipt.merchant, detail: `${receipt.receipt_date}: ${formatCurrency(Number(receipt.total), receipt.currency)}` };
  });

  if (citations.some((citation) => citation === null)) return null;

  return {
    headline: parsed.data.headline,
    insight: parsed.data.insight,
    action: parsed.data.action,
    citations: citations.filter((citation): citation is NonNullable<typeof citation> => Boolean(citation)),
  };
}
