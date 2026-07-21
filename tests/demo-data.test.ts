import { describe, expect, it } from "vitest";
import { demoDashboardData, demoReceipts } from "@/lib/demo-data";

describe("judge-safe Demo Mode data", () => {
  it("contains original fictional receipts across the required spending moments", () => {
    expect(new Set(demoReceipts.map((receipt) => receipt.category))).toEqual(
      new Set(["Groceries", "Dining", "Travel", "Subscriptions", "Coffee"])
    );
    expect(demoReceipts.map((receipt) => receipt.merchant)).not.toContain("Tesco");
    expect(demoDashboardData.story.insights).toHaveLength(3);
  });
});
