import "server-only";

import { getReceiptList } from "@/lib/receipts";

export type ReceiptMemory = { label: string; value: string; detail: string };

export async function getReceiptMemory(): Promise<ReceiptMemory[]> {
  const receipts = await getReceiptList();
  if (!receipts.length) return [];

  const categoryTotals = new Map<string, number>();
  const merchantCounts = new Map<string, number>();
  receipts.forEach((receipt) => {
    categoryTotals.set(receipt.category, (categoryTotals.get(receipt.category) ?? 0) + Number(receipt.total));
    merchantCounts.set(receipt.merchant, (merchantCounts.get(receipt.merchant) ?? 0) + 1);
  });
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const familiarMerchant = [...merchantCounts.entries()].sort((a, b) => b[1] - a[1])[0];
  const latest = receipts[0];

  return [
    { label: "Receipt history", value: `${receipts.length} moments remembered`, detail: "Your uploaded receipts stay private and inform future insights." },
    ...(topCategory ? [{ label: "Spending focus", value: topCategory[0], detail: `Your strongest recorded category at £${topCategory[1].toFixed(2)}.` }] : []),
    ...(familiarMerchant ? [{ label: "Familiar place", value: familiarMerchant[0], detail: `${familiarMerchant[1]} remembered purchase${familiarMerchant[1] === 1 ? "" : "s"}.` }] : []),
    { label: "Last memory", value: latest.merchant, detail: `${latest.receipt_date.slice(0, 10)} · £${Number(latest.total).toFixed(2)}.` },
  ];
}
