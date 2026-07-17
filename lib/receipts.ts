import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mockDashboardData } from "@/lib/mock-data";
import type { ReceiptStatus } from "@/lib/types";

const configured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
);

export type ReceiptListItem = {
  id: string;
  merchant: string;
  receipt_date: string;
  category: string;
  total: number | string;
  currency: string;
  confidence: number;
  status: ReceiptStatus;
  is_business: boolean;
  processing_status: "uploaded" | "processing" | "completed" | "failed" | null;
  original_filename: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ReceiptDetail = ReceiptListItem & {
  storage_path: string | null;
  mime_type: string | null;
  file_size: number | null;
  raw_ocr_text: string | null;
  merchant_name: string | null;
  transaction_date: string | null;
  subtotal: number | string | null;
  tax: number | string | null;
  ai_summary: string | null;
  ocr_provider: string | null;
  error_message: string | null;
  items: ReceiptItem[];
};

export type ReceiptItem = {
  id: string;
  description: string;
  quantity: number | string | null;
  unit_price: number | string | null;
  total: number | string | null;
};

export type ReceiptReasoningRecord = ReceiptListItem & {
  items: ReceiptItem[];
};

const listSelect = `
  id,
  merchant,
  receipt_date,
  category,
  total,
  currency,
  confidence,
  status,
  is_business,
  processing_status,
  original_filename,
  created_at,
  updated_at
`;

const detailSelect = `
  ${listSelect},
  storage_path,
  mime_type,
  file_size,
  raw_ocr_text,
  merchant_name,
  transaction_date,
  subtotal,
  tax,
  ai_summary,
  ocr_provider,
  error_message
`;

export async function getReceiptList(): Promise<ReceiptListItem[]> {
  if (!configured) {
    return mockDashboardData.recent.map((receipt) => ({
      ...receipt,
      currency: "GBP",
      processing_status:
        receipt.status === "review" ? null : receipt.status,
      original_filename: null,
      updated_at: null,
    }));
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipts")
    .select(listSelect)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Unable to load receipts: ${error.message}`);
  }

  return (data ?? []) as ReceiptListItem[];
}

export async function getReceiptDetail(
  id: string
): Promise<ReceiptDetail | null> {
  if (!configured) {
    const receipt = mockDashboardData.recent.find((item) => item.id === id);

    if (!receipt) {
      return null;
    }

    return {
      ...receipt,
      currency: "GBP",
      processing_status:
        receipt.status === "review" ? null : receipt.status,
      original_filename: null,
      updated_at: null,
      storage_path: null,
      mime_type: null,
      file_size: null,
      raw_ocr_text: null,
      merchant_name: null,
      transaction_date: null,
      subtotal: null,
      tax: null,
      ai_summary: null,
      ocr_provider: null,
      error_message: null,
      items: [],
    };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("receipts")
    .select(detailSelect)
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw new Error(`Unable to load receipt: ${error.message}`);
  }

  const { data: items, error: itemsError } = await supabase
    .from("receipt_items")
    .select("id, description, quantity, unit_price, total")
    .eq("receipt_id", id)
    .order("created_at", { ascending: true });

  if (itemsError) {
    throw new Error(`Unable to load receipt items: ${itemsError.message}`);
  }

  return {
    ...(data as Omit<ReceiptDetail, "items">),
    items: (items ?? []) as ReceiptItem[],
  };
}

export async function getReceiptReasoningRecords(
  limit = 25
): Promise<ReceiptReasoningRecord[]> {
  const receipts = (await getReceiptList()).slice(0, limit);

  if (!configured || receipts.length === 0) {
    return receipts.map((receipt) => ({
      ...receipt,
      items: [],
    }));
  }

  const supabase = await createClient();
  const receiptIds = receipts.map((receipt) => receipt.id);

  const { data: items, error } = await supabase
    .from("receipt_items")
    .select("id, receipt_id, description, quantity, unit_price, total")
    .in("receipt_id", receiptIds)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Unable to load receipt reasoning items: ${error.message}`);
  }

  const itemsByReceipt = new Map<string, ReceiptItem[]>();

  (items ?? []).forEach((item) => {
    const receiptId = String(item.receipt_id);
    const currentItems = itemsByReceipt.get(receiptId) ?? [];
    currentItems.push({
      id: item.id,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total: item.total,
    });
    itemsByReceipt.set(receiptId, currentItems);
  });

  return receipts.map((receipt) => ({
    ...receipt,
    items: itemsByReceipt.get(receipt.id) ?? [],
  }));
}
