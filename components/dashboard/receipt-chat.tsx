"use client";

import { Bot, Search, Send, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { answerReceiptQuestion } from "@/lib/receipt-chat";
import type { ReceiptListItem } from "@/lib/receipts";

const suggestions = [
  "How much did I spend on coffee?",
  "What subscriptions do I have?",
  "Which store is becoming more expensive?",
  "What was my biggest purchase?",
];

type ChatSource = "fallback" | "qwen";

export function ReceiptChat({
  receipts,
}: {
  receipts: ReceiptListItem[];
}) {
  const [question, setQuestion] = useState(suggestions[0]);
  const [submittedQuestion, setSubmittedQuestion] = useState(suggestions[0]);
  const fallbackResult = useMemo(
    () => answerReceiptQuestion(submittedQuestion, receipts),
    [submittedQuestion, receipts]
  );
  const [result, setResult] = useState(fallbackResult);
  const [source, setSource] = useState<ChatSource>("fallback");
  const [warning, setWarning] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitQuestion() {
    const nextQuestion = question.trim();
    if (!nextQuestion) return;

    setSubmittedQuestion(nextQuestion);
    setWarning("");
    setResult(answerReceiptQuestion(nextQuestion, receipts));
    setSource("fallback");

    startTransition(async () => {
      const response = await fetch("/api/ai-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: nextQuestion }),
      });

      const body = await response.json().catch(() => null);

      if (!response.ok || !body) {
        setWarning("ReceiptBrain used local reasoning because AI chat was unavailable.");
        return;
      }

      setResult({
        answer: body.answer,
        citations: body.citations ?? [],
      });
      setSource(body.source === "qwen" ? "qwen" : "fallback");
      setWarning(body.warning ?? "");
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="border-b bg-gradient-to-r from-primary/10 via-violet-500/10 to-transparent">
        <CardTitle className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-foreground"><Bot className="size-5" /></span>
          Ask ReceiptBrain
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          A thoughtful answer, grounded in the receipts you’ve chosen to remember.
        </p>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  submitQuestion();
                }
              }}
              className="pl-9"
              placeholder="Ask about your receipts..."
            />
          </div>
          <Button
            type="button"
            onClick={submitQuestion}
          >
            <Send className="size-4" />
            Ask
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setQuestion(suggestion);
                setSubmittedQuestion(suggestion);
                setResult(answerReceiptQuestion(suggestion, receipts));
                setSource("fallback");
                setWarning("");
              }}
              className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="rounded-lg border bg-muted/40 p-4">
          <p className="flex items-center gap-1.5 text-xs font-medium uppercase text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" />
            Question
          </p>
          <p className="mt-1 text-sm font-medium">{submittedQuestion}</p>
          <p className="mt-4 text-xs font-medium uppercase text-muted-foreground">
            Answer
          </p>
          <p className="mt-1 text-sm leading-6">
            {isPending ? "Reasoning over your receipts..." : result.answer}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Reasoning source: {source === "qwen" ? "Qwen Cloud" : "local fallback"}
          </p>
          {warning && (
            <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">
              {warning}
            </p>
          )}
        </div>

        {result.citations.length > 0 && (
          <div>
            <h2 className="text-sm font-medium">Receipts used</h2>
            <div className="mt-2 grid gap-2 md:grid-cols-2">
              {result.citations.map((citation) => (
                <Link
                  key={`${citation.id}-${citation.detail}`}
                  href={`/documents/${citation.id}`}
                  className="rounded-lg border p-3 text-sm hover:bg-muted"
                >
                  <span className="font-medium">{citation.label}</span>
                  <span className="mt-1 block text-muted-foreground">
                    {citation.detail}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
