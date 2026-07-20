import "server-only";

import type { ReceiptReasoningRecord } from "@/lib/receipts";
import { parseWeeklyFinancialPlan, type WeeklyFinancialPlan } from "@/lib/weekly-plan-validation";

export { type WeeklyFinancialPlan } from "@/lib/weekly-plan-validation";

function compactReceipt(receipt: ReceiptReasoningRecord) {
  return {
    id: receipt.id,
    merchant: receipt.merchant,
    date: receipt.receipt_date,
    category: receipt.category,
    total: Number(receipt.total),
    currency: receipt.currency,
    items: receipt.items.slice(0, 40).map((item) => ({
      description: item.description,
      total: item.total === null ? null : Number(item.total),
    })),
  };
}

function buildPrompt(receipts: ReceiptReasoningRecord[]) {
  return [
    "Create one practical weekly financial action from the supplied receipt history.",
    "Use only the supplied data. Do not invent prices, dates, purchases, or savings.",
    "The action must be specific, achievable this week, and framed as a suggestion rather than financial advice.",
    "Choose one to four receipt IDs that directly support the insight.",
    "Return the required JSON object only.",
    "",
    "Receipt history:",
    JSON.stringify(receipts.map(compactReceipt)),
  ].join("\n");
}

function extractOutputText(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;
  if ("output_text" in payload && typeof payload.output_text === "string") return payload.output_text;
  if (!("output" in payload) || !Array.isArray(payload.output)) return null;

  for (const item of payload.output) {
    if (!item || typeof item !== "object" || !("content" in item) || !Array.isArray(item.content)) continue;
    for (const content of item.content) {
      if (content && typeof content === "object" && "type" in content && content.type === "output_text" && "text" in content && typeof content.text === "string") return content.text;
    }
  }
  return null;
}

export function isOpenAiWeeklyPlanConfigured() {
  return Boolean(process.env.OPENAI_API_KEY);
}

export async function createWeeklyFinancialPlan(receipts: ReceiptReasoningRecord[]): Promise<WeeklyFinancialPlan | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || receipts.length === 0) return null;

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: process.env.OPENAI_FINANCE_MODEL ?? "gpt-5.6",
      instructions: "You are ReceiptBrain's careful financial reflection assistant. Keep every claim grounded in the receipt data supplied by the user.",
      input: buildPrompt(receipts),
      text: {
        format: {
          type: "json_schema",
          name: "weekly_financial_action_plan",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              headline: { type: "string" },
              insight: { type: "string" },
              action: { type: "string" },
              evidenceReceiptIds: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 4 },
            },
            required: ["headline", "insight", "action", "evidenceReceiptIds"],
          },
        },
      },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`OpenAI weekly plan failed with ${response.status}${detail ? `: ${detail.slice(0, 300)}` : ""}`);
  }

  const content = extractOutputText(await response.json());
  return content ? parseWeeklyFinancialPlan(content, receipts) : null;
}
