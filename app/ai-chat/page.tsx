import { ReceiptChat } from "@/components/dashboard/receipt-chat";
import Link from "next/link";
import { BrainCircuit } from "lucide-react";
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
      <Link href="/memory" className="flex items-center gap-3 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/50"><span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary"><BrainCircuit className="size-5" /></span><span><span className="block text-sm font-medium">What ReceiptBrain remembers</span><span className="mt-0.5 block text-sm text-muted-foreground">See the private receipt context behind your answers.</span></span></Link>
    </div>
  );
}
