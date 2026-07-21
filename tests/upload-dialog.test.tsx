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
            id: "receipt-1",
          },
        }),
      })
    );
  });

  it("confirms that receipt analysis is queued after upload", async () => {
    render(<UploadDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Upload Receipt" }));

    const input = screen.getByLabelText("Upload receipt").parentElement?.querySelector('input[type="file"]');
    expect(input).not.toBeNull();
    fireEvent.change(input!, { target: { files: [new File(["receipt"], "receipt.png", { type: "image/png" })] } });
    fireEvent.click(screen.getByRole("button", { name: "Start AI processing" }));

    expect(await screen.findByText("Receipt queued for analysis.")).toBeInTheDocument();
    expect(screen.getByText("What I noticed")).toBeInTheDocument();
    expect(screen.getByText(/You can keep using ReceiptBrain while AI reads it/)).toBeInTheDocument();
    await waitFor(() => expect(refresh).toHaveBeenCalledOnce());
  });
});
