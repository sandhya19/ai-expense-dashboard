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

const reprocessSchema = z.object({
  id: z.string().uuid(),
});

function getFastApiError(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }

  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return fallback;
}

export async function reprocessReceipt(formData: FormData) {
  const parsed = reprocessSchema.safeParse({
    id: formData.get("id"),
  });

  if (!parsed.success) {
    redirect(
      `/documents?error=${encodeURIComponent("Invalid receipt reprocess request.")}`
    );
  }

  const receiptServiceUrl = process.env.RECEIPT_SERVICE_URL;

  if (!receiptServiceUrl) {
    redirect(
      `/documents/${parsed.data.id}?error=${encodeURIComponent(
        "Receipt processing service is not configured."
      )}`
    );
  }

  const supabase = await createClient();
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    redirect(
      `/documents/${parsed.data.id}?error=${encodeURIComponent(
        "Your session has expired. Sign in again and retry reprocessing."
      )}`
    );
  }

  const serviceEndpoint = new URL(
    `/v1/receipts/${parsed.data.id}/reprocess`,
    receiptServiceUrl
  );

  const serviceResponse = await fetch(serviceEndpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const responseBody = await serviceResponse.json().catch(() => null);

  if (!serviceResponse.ok) {
    const error = getFastApiError(
      responseBody,
      "Receipt reprocessing failed."
    );

    redirect(
      `/documents/${parsed.data.id}?error=${encodeURIComponent(error)}`
    );
  }

  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath(`/documents/${parsed.data.id}`);

  redirect(`/documents/${parsed.data.id}?reprocessed=1`);
}

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
