import { format, isToday, isYesterday } from "date-fns";
import { ArrowUpRight, CheckCircle2, Clock3, ScanLine } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Receipt } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

function dateLabel(value: string) {
  const date = new Date(`${value}T12:00:00`);
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, d MMMM");
}

function merchantInitials(merchant: string) {
  return merchant.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export function ReceiptTimeline({
  receipts,
  demoMode = false,
}: {
  receipts: Receipt[];
  demoMode?: boolean;
}) {
  const groups = receipts.reduce<Map<string, Receipt[]>>((result, receipt) => {
    const label = dateLabel(receipt.receipt_date);
    result.set(label, [...(result.get(label) ?? []), receipt]);
    return result;
  }, new Map());
  const demoQuery = demoMode ? "?demo=1" : "";

  return (
    <Card>
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">Receipt intelligence</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Your recent money moments</h2>
            <p className="mt-1 text-sm text-muted-foreground">Every receipt becomes a small, useful memory.</p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/documents${demoQuery}`}>Explore all <ArrowUpRight className="size-4" /></Link>
          </Button>
        </div>

        <div className="mt-6 space-y-6">
          {Array.from(groups, ([label, group]) => (
            <section key={label}>
              <h3 className="mb-3 text-sm font-semibold">{label}</h3>
              <div className="space-y-2">
                {group.map((receipt) => (
                  <Link href={`/documents/${receipt.id}${demoQuery}`} key={receipt.id} className="group flex items-center gap-3 rounded-xl border p-3 transition-colors hover:bg-muted/60 sm:p-4">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary/15 to-violet-500/15 text-xs font-semibold text-primary">{merchantInitials(receipt.merchant)}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3"><p className="truncate text-sm font-semibold">{receipt.merchant}</p><p className="shrink-0 text-sm font-semibold tabular-nums">{formatCurrency(Number(receipt.total))}</p></div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground"><span>{receipt.category}</span><span aria-hidden>·</span>{receipt.status === "completed" ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-600" /> AI confidence {receipt.confidence}%</span> : <span className={cn("inline-flex items-center gap-1", receipt.status === "failed" && "text-destructive")}><Clock3 className="size-3" /> {receipt.status === "review" ? "Needs a quick review" : "AI is processing"}</span>}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {receipts.length === 0 && <div className="grid min-h-48 place-items-center rounded-xl border border-dashed text-center"><div><ScanLine className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-medium">Your timeline is ready for its first moment.</p><p className="mt-1 text-sm text-muted-foreground">Upload a receipt and we’ll turn it into a useful memory.</p></div></div>}
      </CardContent>
    </Card>
  );
}
