import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ReceiptTimeline } from "@/components/dashboard/receipt-timeline";

describe("ReceiptTimeline", () => {
  it("gives a calm, useful empty state before the first upload", () => {
    render(<ReceiptTimeline receipts={[]} />);

    expect(screen.getByText("Your timeline is ready for its first moment.")).toBeInTheDocument();
    expect(screen.getByText("Upload a receipt and we’ll turn it into a useful memory.")).toBeInTheDocument();
  });
});
