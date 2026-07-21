import { NextResponse } from "next/server";
import { z } from "zod";
import { answerReceiptQuestion } from "@/lib/receipt-chat";
import { getReceiptReasoningRecords } from "@/lib/receipts";
import {
  answerWithQwenReasoning,
  isQwenReasoningConfigured,
} from "@/lib/qwen-reasoning";

const requestSchema = z.object({
  question: z.string().trim().min(1),
});

export async function POST(request: Request) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => ({})));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Question is required." },
      { status: 400 }
    );
  }

  const demoMode = new URL(request.url).searchParams.get("demo") === "1";
  const receipts = await getReceiptReasoningRecords(25, demoMode);
  const fallback = answerReceiptQuestion(parsed.data.question, receipts);

  if (!isQwenReasoningConfigured()) {
    return NextResponse.json({
      ...fallback,
      source: "fallback",
    });
  }

  try {
    const qwenAnswer = await answerWithQwenReasoning(
      parsed.data.question,
      receipts
    );

    return NextResponse.json({
      ...(qwenAnswer ?? fallback),
      source: qwenAnswer ? "qwen" : "fallback",
    });
  } catch (error) {
    console.error("Qwen receipt reasoning failed:", error);

    return NextResponse.json({
      ...fallback,
      source: "fallback",
      warning: "Qwen reasoning was unavailable, so ReceiptBrain used local reasoning.",
    });
  }
}
