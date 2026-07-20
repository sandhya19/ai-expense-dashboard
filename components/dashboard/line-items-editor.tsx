"use client";

import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { ReceiptItem } from "@/lib/receipts";

type EditableLineItem = {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  total: string;
};

function toInputValue(value: number | string | null) {
  return value === null ? "" : String(value);
}

function toFixedMoney(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : "";
}

export function LineItemsEditor({
  action,
  items,
  receiptId,
}: {
  action: (formData: FormData) => void;
  items: ReceiptItem[];
  receiptId: string;
}) {
  const initialRows = useMemo(
    () =>
      items.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: toInputValue(item.quantity),
        unitPrice: toInputValue(item.unit_price),
        total: toInputValue(item.total),
      })),
    [items]
  );
  const [rows, setRows] = useState<EditableLineItem[]>(initialRows);
  const [deletedItemIds, setDeletedItemIds] = useState<string[]>([]);

  function updateRow(index: number, patch: Partial<EditableLineItem>) {
    setRows((current) =>
      current.map((row, rowIndex) => {
        if (rowIndex !== index) return row;

        const next = { ...row, ...patch };
        const quantity = Number(next.quantity);
        const unitPrice = Number(next.unitPrice);

        if (
          ("quantity" in patch || "unitPrice" in patch) &&
          next.quantity !== "" &&
          next.unitPrice !== "" &&
          Number.isFinite(quantity) &&
          Number.isFinite(unitPrice)
        ) {
          next.total = toFixedMoney(quantity * unitPrice);
        }

        return next;
      })
    );
  }

  function deleteRow(id: string) {
    setRows((current) => current.filter((row) => row.id !== id));
    if (!id.startsWith("new-")) {
      setDeletedItemIds((current) => [...current, id]);
    }
  }

  function addRow() {
    setRows((current) => [
      ...current,
      { id: `new-${Date.now()}`, description: "", quantity: "1", unitPrice: "", total: "" },
    ]);
  }

  return (
    <form
      action={action}
      className="space-y-4"
    >
      <input
        type="hidden"
        name="receiptId"
        value={receiptId}
      />
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-muted/60 p-3">
        <p className="text-sm text-muted-foreground">Missing an item from the scan?</p>
        <Button type="button" variant="outline" size="sm" onClick={addRow}><Plus className="size-4" /> Add missing item</Button>
      </div>
      <div className="space-y-3">
        <div className="hidden grid-cols-[minmax(0,1fr)_96px_112px_112px_40px] gap-3 px-1 text-xs font-medium text-muted-foreground md:grid">
          <span>Item</span><span>Quantity</span><span>Unit price</span><span>Total</span><span />
        </div>
        {rows.map((item, index) => (
          <div key={item.id} className="grid gap-3 rounded-xl border bg-card p-3 md:grid-cols-[minmax(0,1fr)_96px_112px_112px_40px] md:items-end md:rounded-none md:border-x-0 md:border-t-0 md:px-1 md:py-3">
            <input type="hidden" name="itemId" value={item.id.startsWith("new-") ? "" : item.id} />
            <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground md:sr-only">Item</span><Input name="description" value={item.description} onChange={(event) => updateRow(index, { description: event.target.value })} required /></label>
            <div className="grid grid-cols-3 gap-3 md:contents">
              <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground md:sr-only">Quantity</span><Input name="quantity" type="number" min="0" step="0.001" value={item.quantity} onChange={(event) => updateRow(index, { quantity: event.target.value })} /></label>
              <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground md:sr-only">Unit price</span><Input name="unitPrice" type="number" step="0.01" value={item.unitPrice} onChange={(event) => updateRow(index, { unitPrice: event.target.value })} /></label>
              <label className="space-y-1.5"><span className="text-xs font-medium text-muted-foreground md:sr-only">Total</span><Input name="total" type="number" step="0.01" value={item.total} onChange={(event) => updateRow(index, { total: event.target.value })} /></label>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={() => deleteRow(item.id)} aria-label={`Delete ${item.description}`} title="Delete line item" className="justify-self-end"><Trash2 className="size-4 text-destructive" /></Button>
          </div>
        ))}
      </div>
      {deletedItemIds.map((id) => (
        <input key={id} type="hidden" name="deletedItemId" value={id} />
      ))}
      {rows.length === 0 && (
        <p className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
          All extracted line items will be removed when you save.
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        <Button type="submit">Save line items</Button>
      </div>
    </form>
  );
}
