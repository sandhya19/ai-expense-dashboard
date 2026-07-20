import { describe, expect, it } from "vitest";
import { buildSpendingDnaHistory } from "@/lib/spending-dna-history";
import type { Receipt } from "@/lib/types";

const receipt: Receipt = {
  id: "aldi-1",
  merchant: "Aldi",
  receipt_date: "2026-07-10",
  category: "Groceries",
  total: 42,
  confidence: 98,
  status: "completed",
  is_business: false,
  created_at: "2026-07-10T12:00:00Z",
};

describe("buildSpendingDnaHistory", () => {
  it("only includes receipts available by each month", () => {
    const history = buildSpendingDnaHistory([receipt], new Date("2026-07-17T12:00:00Z"), 2);

    expect(history.map((point) => point.label)).toEqual(["Jun", "Jul"]);
    expect(history[0].traits.find((trait) => trait.id === "smart-shopper")?.score).toBe(0);
    expect(history[1].traits.find((trait) => trait.id === "smart-shopper")?.score).toBeGreaterThan(0);
  });
});
