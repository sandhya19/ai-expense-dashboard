"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { zodResolver } from "@hookform/resolvers/zod";
import { Camera, Upload, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const schema = z.object({ file: z.any().refine((files) => files?.length === 1, "Choose one receipt image or PDF") });
type Values = z.infer<typeof schema>;

export function UploadDialog({ camera = false }: { camera?: boolean }) {
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState("");
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError("");
    const formData = new FormData();
    formData.append("file", values.file[0]);
    const response = await fetch("/api/documents", { method: "POST", body: formData });
    if (!response.ok) { const body = await response.json().catch(() => ({})); setServerError(body.error ?? "Upload failed"); return; }
    reset(); setOpen(false); router.refresh();
  }

  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild><Button variant={camera ? "outline" : "default"}>{camera ? <Camera className="size-4" /> : <Upload className="size-4" />}{camera ? "Scan with Camera" : "Upload Receipt"}</Button></Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/50" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border bg-background p-6 shadow-xl"><div className="flex items-start justify-between"><div><Dialog.Title className="font-semibold">{camera ? "Scan receipt" : "Upload receipt"}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">Upload JPG, PNG, WEBP, or PDF. Maximum 10 MB.</Dialog.Description></div><Dialog.Close asChild><Button variant="ghost" size="icon"><X className="size-4" /></Button></Dialog.Close></div><form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}><Input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" capture={camera ? "environment" : undefined} {...register("file")} />{errors.file && <p className="text-sm text-destructive">{String(errors.file.message)}</p>}{serverError && <p className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{serverError}</p>}<Button className="w-full" disabled={isSubmitting}>{isSubmitting ? "Uploading..." : "Start AI processing"}</Button></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}
