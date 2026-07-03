"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  id: z.string().uuid(),
  merchant: z.string().trim().min(1, "Merchant is required."),
  receiptDate: z.string().trim().min(1, "Receipt date is required."),
  category: z.string().trim().min(1, "Category is required."),
  total: z.coerce.number().min(0, "Total must be zero or more."),
  currency: z
    .string()
    .trim()
    .length(3, "Currency must be a 3-letter code.")
    .transform((value) => value.toUpperCase()),
  status: z.enum(["processing", "review", "completed", "failed"]),
  isBusiness: z
    .string()
    .optional()
    .transform((value) => value === "on"),
});

export async function updateReceiptReview(formData: FormData) {
  const parsed = reviewSchema.safeParse({
    id: formData.get("id"),
    merchant: formData.get("merchant"),
    receiptDate: formData.get("receiptDate"),
    category: formData.get("category"),
    total: formData.get("total"),
    currency: formData.get("currency"),
    status: formData.get("status"),
    isBusiness: formData.get("isBusiness"),
  });

  if (!parsed.success) {
    const id = String(formData.get("id") ?? "");

    redirect(
      `/documents/${id}?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid receipt update."
      )}`
    );
  }

  const supabase = await createClient();

  const { id, merchant, receiptDate, category, total, currency, status, isBusiness } =
    parsed.data;

  const { error } = await supabase
    .from("receipts")
    .update({
      merchant,
      receipt_date: receiptDate,
      category,
      total,
      currency,
      status,
      is_business: isBusiness,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(
      `/documents/${id}?error=${encodeURIComponent(error.message)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);

  redirect(`/documents/${id}?saved=1`);
}
