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
    .nullish()
    .transform((value) => value === "on"),
});

const reprocessSchema = z.object({
  id: z.string().uuid(),
});

const optionalNumberSchema = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.coerce.number().nullable()
);

const optionalQuantitySchema = z.preprocess(
  (value) => (value === "" || value === null ? null : value),
  z.coerce.number().min(0).nullable()
);

const lineItemSchema = z.object({
  id: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.string().uuid().optional()
  ),
  description: z.string().trim().min(1, "Item description is required."),
  quantity: optionalQuantitySchema,
  unitPrice: optionalNumberSchema,
  total: optionalNumberSchema,
});

const lineItemsSchema = z.object({
  receiptId: z.string().uuid(),
  items: z.array(lineItemSchema),
  deletedItemIds: z.array(z.string().uuid()),
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

export async function deleteReceipt(formData: FormData) {
  const parsed = reprocessSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) redirect("/documents?error=Invalid%20receipt%20delete%20request.");

  const receiptServiceUrl = process.env.RECEIPT_SERVICE_URL;
  if (!receiptServiceUrl) redirect(`/documents/${parsed.data.id}?error=Receipt%20processing%20service%20is%20not%20configured.`);

  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) redirect(`/documents/${parsed.data.id}?error=Your%20session%20has%20expired.`);

  const response = await fetch(new URL(`/v1/receipts/${parsed.data.id}`, receiptServiceUrl), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    redirect(`/documents/${parsed.data.id}?error=${encodeURIComponent(getFastApiError(body, "Receipt deletion failed."))}`);
  }

  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/documents");
  redirect("/documents?deleted=1");
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

  const { data: lineItems, error: lineItemsError } = await supabase
    .from("receipt_items")
    .select("total")
    .eq("receipt_id", id);

  if (lineItemsError) {
    redirect(
      `/documents/${id}?error=${encodeURIComponent(lineItemsError.message)}`
    );
  }

  const lineItemTotal = (lineItems ?? []).reduce(
    (sum, item) => sum + Number(item.total ?? 0),
    0
  );
  const isValidated =
    (lineItems?.length ?? 0) > 0 &&
    (lineItems ?? []).every((item) => item.total !== null) &&
    Math.abs(lineItemTotal - total) <= 0.01;
  const validatedStatus = status === "failed" ? "failed" : isValidated ? "completed" : "review";

  const { data: updatedReceipt, error } = await supabase
    .from("receipts")
    .update({
      merchant,
      merchant_name: merchant,
      receipt_date: receiptDate,
      category,
      total,
      currency,
      status: validatedStatus,
      is_business: isBusiness,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error || !updatedReceipt) {
    redirect(
      `/documents/${id}?error=${encodeURIComponent(
        error?.message ?? "Receipt update was not authorised. Sign in again and retry."
      )}`
    );
  }

  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath(`/documents/${id}`);

  redirect(`/documents/${id}?saved=1`);
}

export async function updateReceiptLineItems(formData: FormData) {
  const ids = formData.getAll("itemId");
  const descriptions = formData.getAll("description");
  const quantities = formData.getAll("quantity");
  const unitPrices = formData.getAll("unitPrice");
  const totals = formData.getAll("total");
  const deletedItemIds = formData.getAll("deletedItemId");

  const parsed = lineItemsSchema.safeParse({
    receiptId: formData.get("receiptId"),
    items: ids.map((id, index) => ({
      id,
      description: descriptions[index],
      quantity: quantities[index],
      unitPrice: unitPrices[index],
      total: totals[index],
    })),
    deletedItemIds,
  });

  const receiptId = String(formData.get("receiptId") ?? "");

  if (!parsed.success) {
    redirect(
      `/documents/${receiptId}?error=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Invalid line item update."
      )}`
    );
  }

  const supabase = await createClient();

  const { data: receipt, error: receiptError } = await supabase
    .from("receipts")
    .select("total, user_id")
    .eq("id", parsed.data.receiptId)
    .single();

  if (receiptError || !receipt) {
    redirect(
      `/documents/${parsed.data.receiptId}?error=${encodeURIComponent(
        receiptError?.message ?? "Receipt could not be found."
      )}`
    );
  }

  const updates = parsed.data.items.filter((item) => item.id).map((item) =>
    supabase
      .from("receipt_items")
      .update({
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total: item.total,
      })
      .eq("id", item.id!)
      .eq("receipt_id", parsed.data.receiptId)
  );

  const deletions = parsed.data.deletedItemIds.map((itemId) =>
    supabase
      .from("receipt_items")
      .delete()
      .eq("id", itemId)
      .eq("receipt_id", parsed.data.receiptId)
  );

  const newItems = parsed.data.items.filter((item) => !item.id);
  const insertion = newItems.length
    ? supabase.from("receipt_items").insert(
        newItems.map((item) => ({
          receipt_id: parsed.data.receiptId,
          user_id: receipt.user_id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total: item.total,
        }))
      )
    : null;

  const results = await Promise.all([...updates, ...deletions]);
  const error = results.find((result) => result.error)?.error ?? (await insertion)?.error;

  if (error) {
    redirect(
      `/documents/${parsed.data.receiptId}?error=${encodeURIComponent(
        error.message
      )}`
    );
  }

  const receiptTotal = Number(receipt.total ?? 0);
  const itemTotal = parsed.data.items.reduce(
    (sum, item) => sum + Number(item.total ?? 0),
    0
  );
  const status =
    parsed.data.items.length > 0 &&
    parsed.data.items.every((item) => item.total !== null) &&
    Math.abs(itemTotal - receiptTotal) <= 0.01
      ? "completed"
      : "review";

  await supabase
    .from("receipts")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parsed.data.receiptId);

  revalidatePath("/");
  revalidatePath("/documents");
  revalidatePath(`/documents/${parsed.data.receiptId}`);

  redirect(`/documents/${parsed.data.receiptId}?itemsSaved=1`);
}
