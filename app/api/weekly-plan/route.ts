import { NextResponse } from "next/server";
import { createWeeklyFinancialPlan, isOpenAiWeeklyPlanConfigured } from "@/lib/openai-weekly-plan";
import { getReceiptReasoningRecords } from "@/lib/receipts";

export async function POST() {
  if (!isOpenAiWeeklyPlanConfigured()) {
    return NextResponse.json({ error: "OpenAI weekly plans are not configured." }, { status: 503 });
  }

  const receipts = await getReceiptReasoningRecords();
  if (!receipts.length) {
    return NextResponse.json({ error: "Upload a receipt before creating an action plan." }, { status: 400 });
  }

  try {
    const plan = await createWeeklyFinancialPlan(receipts);
    if (!plan) return NextResponse.json({ error: "ReceiptBrain could not verify a grounded action plan. Please try again." }, { status: 502 });
    return NextResponse.json({ plan, source: "gpt-5.6" });
  } catch (error) {
    console.error("OpenAI weekly plan failed:", error);
    return NextResponse.json({ error: "ReceiptBrain could not create an action plan right now." }, { status: 502 });
  }
}
