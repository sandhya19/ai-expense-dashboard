import { describe, expect, it } from "vitest";
import { parseWeeklyFinancialPlan } from "@/lib/weekly-plan-validation";
import type { ReceiptListItem } from "@/lib/receipts";

const receipt: ReceiptListItem = {
  id: "receipt-1",
  merchant: "Tesco",
  receipt_date: "2026-07-20",
  category: "Groceries",
  total: 42.5,
  currency: "GBP",
  confidence: 0.98,
  status: "completed",
  is_business: false,
  processing_status: "completed",
  original_filename: "tesco.png",
  created_at: "2026-07-20T10:00:00Z",
  updated_at: null,
};

describe("weekly financial plan", () => {
  it("keeps only action plans with receipt evidence from the supplied context", () => {
    const plan = parseWeeklyFinancialPlan(
      JSON.stringify({
        headline: "Plan your grocery shop",
        insight: "Your latest grocery receipt was £42.50.",
        action: "Make a list before your next grocery shop.",
        evidenceReceiptIds: ["receipt-1"],
      }),
      [receipt]
    );

    expect(plan).toMatchObject({
      headline: "Plan your grocery shop",
      citations: [{ id: "receipt-1", label: "Tesco" }],
    });
  });

  it("rejects action plans that cite receipts outside the supplied context", () => {
    expect(
      parseWeeklyFinancialPlan(
        JSON.stringify({
          headline: "Unsupported plan",
          insight: "This is unsupported.",
          action: "Do something.",
          evidenceReceiptIds: ["unknown-receipt"],
        }),
        [receipt]
      )
    ).toBeNull();
  });
});
