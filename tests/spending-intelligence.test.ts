import { describe, expect, it } from "vitest";
import { buildSpendingDna, buildSpendingStory } from "@/lib/spending-intelligence";
import type { Receipt } from "@/lib/types";

const receipt = (overrides: Partial<Receipt>): Receipt => ({
  id: "receipt-1",
  merchant: "Aldi",
  receipt_date: "2026-07-10",
  category: "Groceries",
  total: 20,
  confidence: 95,
  status: "completed",
  is_business: false,
  created_at: "2026-07-10T12:00:00Z",
  ...overrides,
});

describe("spending intelligence", () => {
  it("creates a current-month story with a meaningful comparison", () => {
    const story = buildSpendingStory(
      [
        receipt({ total: 120, receipt_date: "2026-07-10", category: "Dining" }),
        receipt({ id: "receipt-2", total: 100, receipt_date: "2026-06-10", category: "Dining" }),
      ],
      new Date("2026-07-17T12:00:00Z")
    );

    expect(story.total).toBe(120);
    expect(story.changePercent).toBe(20);
    expect(story.insights[0]).toMatchObject({
      id: "monthly-spend",
      title: "You spent 20% more this month",
    });
  });

  it("derives a Smart Shopper trait from value-led merchants", () => {
    const dna = buildSpendingDna([
      receipt({ merchant: "Aldi", total: 40 }),
      receipt({ id: "receipt-2", merchant: "Lidl", total: 40 }),
      receipt({ id: "receipt-3", merchant: "Coffee shop", category: "Coffee", total: 20 }),
    ]);

    expect(dna.find((trait) => trait.id === "smart-shopper")?.score).toBeGreaterThan(0);
  });

  it("identifies the strongest day-of-week spending rhythm", () => {
    const story = buildSpendingStory(
      [
        receipt({ total: 30, receipt_date: "2026-07-03" }),
        receipt({ id: "receipt-2", total: 40, receipt_date: "2026-07-10" }),
        receipt({ id: "receipt-3", total: 10, receipt_date: "2026-07-08" }),
      ],
      new Date("2026-07-17T12:00:00Z")
    );

    expect(story.insights).toContainEqual(expect.objectContaining({
      id: "spending-rhythm",
      title: "Friday is your biggest spending day",
      supporting_data: "£70.00 across 2 purchases",
    }));
  });
});
