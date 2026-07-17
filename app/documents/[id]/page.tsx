import { format } from "date-fns";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  RotateCcw,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import type React from "react";
import { Button } from "@/components/ui/button";
import { LineItemsEditor } from "@/components/dashboard/line-items-editor";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getReceiptDetail } from "@/lib/receipts";
import { cn, formatCurrency } from "@/lib/utils";
import {
  reprocessReceipt,
  updateReceiptLineItems,
  updateReceiptReview,
} from "./actions";

type ReceiptDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    saved?: string;
    reprocessed?: string;
    itemsSaved?: string;
    error?: string;
  }>;
};

const statusStyles = {
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function MetadataRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  );
}

export default async function ReceiptDetailPage({
  params,
  searchParams,
}: ReceiptDetailPageProps) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const receipt = await getReceiptDetail(id);

  if (!receipt) {
    notFound();
  }

  const receiptDate = receipt.receipt_date
    ? receipt.receipt_date.slice(0, 10)
    : "";
  const fileUrl = receipt.storage_path
    ? `/api/documents/${receipt.id}/file`
    : null;
  const canPreviewImage = receipt.mime_type?.startsWith("image/");
  const canPreviewPdf = receipt.mime_type === "application/pdf";
  const reviewedItemTotal = receipt.items.reduce(
    (sum, item) => sum + Number(item.total ?? 0),
    0
  );
  const lineItemsValidated =
    receipt.items.length > 0 &&
    receipt.items.every((item) => item.total !== null) &&
    Math.abs(reviewedItemTotal - Number(receipt.total)) <= 0.01;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="-ml-3 mb-2"
          >
            <Link href="/documents">
              <ArrowLeft className="size-4" />
              Documents
            </Link>
          </Button>

          <h1 className="text-3xl font-bold tracking-tight">
            {receipt.merchant}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Review extracted receipt details and dashboard fields.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium capitalize",
              statusStyles[receipt.status]
            )}
          >
            {receipt.status}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium capitalize">
            AI {receipt.processing_status ?? "unknown"}
          </span>
        </div>
      </div>

      {query.saved && (
        <p className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          Receipt review saved.
        </p>
      )}

      {query.reprocessed && (
        <p className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          Receipt reprocessed.
        </p>
      )}

      {query.itemsSaved && (
        <p className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4" />
          Line items saved.
        </p>
      )}

      {query.error && (
        <p className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4" />
          {query.error}
        </p>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Card>
          <CardHeader>
            <CardTitle>Reviewed fields</CardTitle>
            <p className="text-sm text-muted-foreground">
              Correct the merchant and receipt details here, then save them separately from line-item edits.
            </p>
          </CardHeader>

          <CardContent>
            <form
              action={updateReceiptReview}
              className="grid gap-4 md:grid-cols-2"
            >
              <input
                type="hidden"
                name="id"
                value={receipt.id}
              />

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm font-medium">Merchant name</span>
                <Input
                  name="merchant"
                  defaultValue={receipt.merchant}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Receipt date</span>
                <Input
                  name="receiptDate"
                  type="date"
                  defaultValue={receiptDate}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Category</span>
                <Input
                  name="category"
                  defaultValue={receipt.category}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Total</span>
                <Input
                  name="total"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={String(receipt.total)}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Currency</span>
                <Input
                  name="currency"
                  maxLength={3}
                  defaultValue={receipt.currency}
                  required
                />
              </label>

              <div className="space-y-2">
                <input type="hidden" name="status" value="review" />
                <span className="text-sm font-medium">Validation status</span>
                <p className={cn("rounded-md px-3 py-2 text-sm", lineItemsValidated ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-amber-500/10 text-amber-700 dark:text-amber-400")}>
                  {lineItemsValidated ? "Completed automatically — line items match the receipt total." : "Review required — line items must match before completion."}
                </p>
              </div>

              <label className="flex items-center gap-2 pt-8 text-sm font-medium">
                <input
                  name="isBusiness"
                  type="checkbox"
                  defaultChecked={receipt.is_business}
                  className="size-4 rounded border-input"
                />
                Business expense
              </label>

              <div className="flex justify-end md:col-span-2">
                <Button type="submit">Save receipt details</Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Receipt metadata</CardTitle>
            <form action={reprocessReceipt}>
              <input
                type="hidden"
                name="id"
                value={receipt.id}
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
              >
                <RotateCcw className="size-4" />
                Reprocess
              </Button>
            </form>
          </CardHeader>

          <CardContent>
            <MetadataRow
              label="Current total"
              value={formatCurrency(Number(receipt.total), receipt.currency)}
            />
            <MetadataRow
              label="Confidence"
              value={`${receipt.confidence}%`}
            />
            <MetadataRow
              label="Uploaded"
              value={format(new Date(receipt.created_at), "dd MMM yyyy HH:mm")}
            />
            <MetadataRow
              label="Filename"
              value={receipt.original_filename ?? "Not available"}
            />
            <MetadataRow
              label="MIME type"
              value={receipt.mime_type ?? "Not available"}
            />
            <MetadataRow
              label="File size"
              value={
                receipt.file_size
                  ? `${Math.round(receipt.file_size / 1024)} KB`
                  : "Not available"
              }
            />
            <MetadataRow
              label="OCR provider"
              value={receipt.ocr_provider ?? "Not available"}
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Original receipt</CardTitle>
          {fileUrl && (
            <Button
              variant="outline"
              size="sm"
              asChild
            >
              <Link href={`${fileUrl}?download=1`}>
                <Download className="size-4" />
                Download
              </Link>
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {!fileUrl ? (
            <div className="grid min-h-64 place-items-center rounded-lg border border-dashed text-center">
              <div>
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  Original file unavailable
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  The receipt record does not include a storage path.
                </p>
              </div>
            </div>
          ) : canPreviewImage ? (
            <div className="overflow-hidden rounded-lg border bg-muted">
              <img
                src={fileUrl}
                alt={`Original receipt for ${receipt.merchant}`}
                className="max-h-[720px] w-full object-contain"
              />
            </div>
          ) : canPreviewPdf ? (
            <iframe
              src={fileUrl}
              title={`Original receipt for ${receipt.merchant}`}
              className="h-[720px] w-full rounded-lg border"
            />
          ) : (
            <div className="grid min-h-64 place-items-center rounded-lg border border-dashed text-center">
              <div>
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">
                  Preview is not available
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Download the original file to inspect it.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AI extraction</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <MetadataRow
                label="Merchant"
                value={receipt.merchant_name ?? "Not extracted"}
              />
              <MetadataRow
                label="Transaction date"
                value={receipt.transaction_date ?? "Not extracted"}
              />
              <MetadataRow
                label="Subtotal"
                value={
                  receipt.subtotal
                    ? formatCurrency(Number(receipt.subtotal), receipt.currency)
                    : "Not extracted"
                }
              />
              <MetadataRow
                label="Tax"
                value={
                  receipt.tax
                    ? formatCurrency(Number(receipt.tax), receipt.currency)
                    : "Not extracted"
                }
              />
            </div>

            <div>
              <h2 className="text-sm font-medium">Summary</h2>
              <p className="mt-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
                {receipt.ai_summary ?? "No summary available."}
              </p>
            </div>

            {receipt.error_message && (
              <div>
                <h2 className="text-sm font-medium text-destructive">
                  Processing error
                </h2>
                <p className="mt-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  {receipt.error_message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line items</CardTitle>
          </CardHeader>

          <CardContent>
            {receipt.items.length > 0 ? (
              <LineItemsEditor
                action={updateReceiptLineItems}
                items={receipt.items}
                receiptId={receipt.id}
              />
            ) : (
              <div className="grid min-h-40 place-items-center rounded-lg border border-dashed text-center">
                <div>
                  <FileText className="mx-auto size-9 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    No line items extracted
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    ReceiptBrain will show item-level purchases here when the OCR text includes clear line items.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Raw OCR text</CardTitle>
          </CardHeader>

          <CardContent>
            {receipt.raw_ocr_text ? (
              <pre className="max-h-96 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-4 text-sm leading-6">
                {receipt.raw_ocr_text}
              </pre>
            ) : (
              <div className="grid min-h-64 place-items-center rounded-lg border border-dashed text-center">
                <div>
                  <FileText className="mx-auto size-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium">
                    No OCR text available
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    OCR text will appear here after processing completes.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
