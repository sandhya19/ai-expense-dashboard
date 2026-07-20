import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "receiptbrain-web",
    receiptProcessorConfigured: Boolean(process.env.RECEIPT_SERVICE_URL),
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    ),
    qwenChatConfigured: Boolean(process.env.QWEN_API_KEY),
    openAiWeeklyPlanConfigured: Boolean(process.env.OPENAI_API_KEY),
  });
}
