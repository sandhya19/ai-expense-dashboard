import { ReceiptChat } from "@/components/dashboard/receipt-chat";
import { getReceiptList } from "@/lib/receipts";

export default async function AiChatPage() {
  const receipts = await getReceiptList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI chat</h1>
        <p className="mt-1 text-muted-foreground">
          Ask ReceiptBrain questions about your receipt history and spending patterns.
        </p>
      </div>

      <ReceiptChat receipts={receipts} />
    </div>
  );
}
