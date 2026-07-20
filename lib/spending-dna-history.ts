import { buildSpendingDna } from "@/lib/spending-intelligence";
import type { Receipt, SpendingDnaTrait } from "@/lib/types";

export type SpendingDnaHistoryPoint = {
  label: string;
  traits: SpendingDnaTrait[];
};

export function buildSpendingDnaHistory(
  receipts: Receipt[],
  now = new Date(),
  months = 6
): SpendingDnaHistoryPoint[] {
  return Array.from({ length: months }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (months - index - 1), 1);
    const inclusiveEnd = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    const receiptsToDate = receipts.filter((receipt) => {
      const receiptDate = new Date(`${receipt.receipt_date}T12:00:00`);
      return receiptDate < inclusiveEnd;
    });

    return {
      label: new Intl.DateTimeFormat("en-GB", { month: "short" }).format(date),
      traits: buildSpendingDna(receiptsToDate),
    };
  });
}
