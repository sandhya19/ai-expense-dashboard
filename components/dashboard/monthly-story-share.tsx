"use client";

import { Check, Copy, Share2, Sparkles } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { SpendingStory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

function shareText(story: SpendingStory) {
  const headline = story.insights[0]?.title ?? "I am learning from every receipt.";
  return [`My ${story.periodLabel} spending story`, `${formatCurrency(story.total)} tracked across ReceiptBrain.`, headline].join("\n");
}

export function MonthlyStoryShare({ story }: { story: SpendingStory }) {
  const [copied, setCopied] = useState(false);
  const canShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  async function share() {
    const text = shareText(story);
    if (navigator.share) {
      await navigator.share({ title: `My ${story.periodLabel} spending story`, text });
      return;
    }
    await navigator.clipboard.writeText(text);
    setCopied(true);
  }

  return <div className="space-y-5"><Card className="overflow-hidden border-0 bg-gradient-to-br from-fuchsia-600 via-violet-700 to-slate-950 text-white shadow-xl"><CardContent className="relative p-7 sm:p-10"><div className="absolute -right-16 -top-16 size-72 rounded-full bg-amber-200/20 blur-3xl" /><div className="absolute -bottom-20 left-16 size-64 rounded-full bg-cyan-300/15 blur-3xl" /><div className="relative"><p className="flex items-center gap-2 text-sm font-medium text-violet-100"><Sparkles className="size-4" /> ReceiptBrain presents</p><h2 className="mt-7 text-4xl font-semibold tracking-tight sm:text-6xl">Your {story.periodLabel}<br />spending story.</h2><p className="mt-8 text-sm text-violet-100">Tracked spending</p><p className="mt-1 text-5xl font-semibold tracking-tight sm:text-7xl">{formatCurrency(story.total)}</p><p className="mt-8 max-w-xl text-base leading-7 text-violet-100">{story.insights[0]?.description ?? "Every receipt is another clue to the habits behind your money."}</p></div></CardContent></Card><div className="grid gap-4 md:grid-cols-3">{story.insights.map((insight, index) => <Card key={insight.id}><CardContent className="p-5"><p className="text-xs font-medium uppercase tracking-[0.18em] text-primary">Moment {index + 1}</p><h3 className="mt-3 font-semibold tracking-tight">{insight.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{insight.supporting_data}</p></CardContent></Card>)}</div><Card><CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between"><div><h3 className="font-semibold">Share a thought, not your receipt data.</h3><p className="mt-1 text-sm text-muted-foreground">Only this month’s summary and one insight are included—never merchants, images, or line items.</p></div><Button onClick={() => void share()}>{copied ? <Check className="size-4" /> : canShare ? <Share2 className="size-4" /> : <Copy className="size-4" />}{copied ? "Copied" : "Share story"}</Button></CardContent></Card></div>;
}
