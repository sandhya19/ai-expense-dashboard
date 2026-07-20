"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteReceiptButton({ action, receiptId }: { action: (formData: FormData) => void; receiptId: string }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm("Delete this receipt, its extracted items, and its original file? This cannot be undone.")) event.preventDefault(); }}><input type="hidden" name="id" value={receiptId} /><Button type="submit" variant="outline" size="sm" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"><Trash2 className="size-4" />Delete</Button></form>;
}
