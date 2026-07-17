import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UploadDialog } from "@/components/dashboard/upload-dialog";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

describe("UploadDialog", () => {
  beforeEach(() => {
    refresh.mockReset();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          receipt: {
            merchant: "Aldi",
            category: "Groceries",
            confidence: 98,
            ai_summary: "This shop is below your usual weekly grocery spend.",
          },
        }),
      })
    );
  });

  it("shows scan success and the AI notice after a receipt is uploaded", async () => {
    render(<UploadDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Upload Receipt" }));

    const input = screen.getByLabelText("Upload receipt").parentElement?.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { files: [new File(["receipt"], "receipt.png", { type: "image/png" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Start AI processing" }));

    expect(await screen.findByText("Aldi scanned successfully.")).toBeInTheDocument();
    expect(screen.getByText("What I noticed")).toBeInTheDocument();
    expect(screen.getByText("This shop is below your usual weekly grocery spend.")).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
