"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, CheckCircle2, ScanLine, Sparkles, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({
  file: z
    .any()
    .refine(
      (files) => files?.length === 1,
      "Choose one receipt image or PDF"
    ),
});

type Values = z.infer<typeof schema>;

export function UploadDialog({
  camera = false,
}: {
  camera?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const [serverSuccess, setServerSuccess] = useState("");
  const [notice, setNotice] = useState("");
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<Values>({
    resolver: zodResolver(schema),
  });

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);

    if (!nextOpen) {
      setServerError("");
      setServerSuccess("");
      setNotice("");
      reset();
    }
  }

  async function onSubmit(values: Values) {
    setServerError("");
    setServerSuccess("");
    setNotice("");

    const formData = new FormData();
    formData.append("file", values.file[0]);

    const response = await fetch("/api/documents", {
      method: "POST",
      body: formData,
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setServerError(
        body.error ??
          body.detail ??
          "Receipt upload failed. Try again."
      );
      return;
    }

    const receipt = body.receipt as {
      merchant?: string;
      total?: string | number;
      currency?: string;
      category?: string;
      confidence?: number;
      ai_summary?: string | null;
    } | undefined;
    setServerSuccess(receipt?.merchant ? `${receipt.merchant} scanned successfully.` : "Receipt scanned successfully.");
    setNotice(receipt?.ai_summary ?? (receipt?.confidence ? `AI extracted ${receipt.category ?? "your purchase"} with ${receipt.confidence}% confidence.` : "Your receipt is now part of your spending story."));
    reset();
    router.refresh();
  }

  return (
    <Dialog.Root
      open={open}
      onOpenChange={handleOpenChange}
    >
      <Dialog.Trigger asChild>
        <Button variant={camera ? "outline" : "default"}>
          {camera ? (
            <Camera className="size-4" />
          ) : (
            <Upload className="size-4" />
          )}
          {camera ? "Scan with Camera" : "Upload Receipt"}
        </Button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" />

        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl">
          <div className="flex items-start justify-between">
            <div>
              <Dialog.Title className="font-semibold">
                {camera ? "Scan receipt" : "Upload receipt"}
              </Dialog.Title>

              <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                Upload JPG, PNG, or PDF. Maximum 10 MB.
              </Dialog.Description>
            </div>

            <Dialog.Close asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close"
              >
                <X className="size-4" />
              </Button>
            </Dialog.Close>
          </div>

          <form
            className="mt-6 space-y-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Input
              type="file"
              accept="image/jpeg,image/png,application/pdf"
              capture={camera ? "environment" : undefined}
              disabled={isSubmitting}
              {...register("file")}
            />

            {errors.file && (
              <p className="text-sm text-destructive">
                {String(errors.file.message)}
              </p>
            )}

            {isSubmitting && (
              <div className="rounded-xl border bg-muted/50 p-4">
                <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary animate-pulse"><ScanLine className="size-5" /></span><div><p className="text-sm font-medium">ReceiptBrain is reading this moment</p><p className="mt-0.5 text-xs text-muted-foreground">Extracting totals, merchant details, and the patterns that matter.</p></div></div>
              </div>
            )}

            {serverSuccess && (
              <p className="flex items-center gap-2 rounded-md bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                {serverSuccess}
              </p>
            )}

            {notice && (
              <div className="rounded-xl bg-primary/5 p-4 text-sm">
                <p className="flex items-center gap-2 font-medium text-primary"><Sparkles className="size-4" /> What I noticed</p>
                <p className="mt-2 leading-6 text-muted-foreground">{notice}</p>
              </div>
            )}

            {serverError && (
              <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {serverError}
              </p>
            )}

            <Button
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Uploading..."
                : serverSuccess
                  ? "Upload another receipt"
                  : "Start AI processing"}
            </Button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
