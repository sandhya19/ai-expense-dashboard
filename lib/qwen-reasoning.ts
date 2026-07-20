import "server-only";

import type { ReceiptChatResult } from "@/lib/receipt-chat";
import type { ReceiptListItem, ReceiptReasoningRecord } from "@/lib/receipts";
import { formatCurrency } from "@/lib/utils";

type QwenReceiptReasoning = {
  answer: string;
  receiptIds: string[];
};

const QWEN_BASE_URL =
  process.env.QWEN_BASE_URL ??
  "https://dashscope-intl.aliyuncs.com/compatible-mode/v1";
const QWEN_REASONING_MODEL = process.env.QWEN_REASONING_MODEL ?? "qwen-plus";

function compactReceipt(receipt: ReceiptReasoningRecord) {
  return {
    id: receipt.id,
    merchant: receipt.merchant,
    date: receipt.receipt_date,
    category: receipt.category,
    total: Number(receipt.total),
    currency: receipt.currency,
    status: receipt.status,
    processingStatus: receipt.processing_status,
    items: receipt.items.slice(0, 80).map((item) => ({
      description: item.description,
      quantity: item.quantity === null ? null : Number(item.quantity),
      unitPrice: item.unit_price === null ? null : Number(item.unit_price),
      total: item.total === null ? null : Number(item.total),
    })),
  };
}

function buildPrompt(question: string, receipts: ReceiptReasoningRecord[]) {
  return [
    "You are ReceiptBrain, a receipt reasoning assistant.",
    "Answer using only the supplied receipt data.",
    "Be concise, practical, and mention uncertainty when the data is insufficient.",
    "Return valid JSON only with this shape:",
    '{"answer":"string","receiptIds":["receipt-id"]}',
    "",
    `Question: ${question}`,
    "",
    "Receipts with line items and discounts:",
    JSON.stringify(receipts.map(compactReceipt)),
  ].join("\n");
}

function parseQwenJson(content: string): QwenReceiptReasoning | null {
  const trimmed = content.trim();
  const jsonText = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");

  try {
    const parsed = JSON.parse(jsonText) as unknown;
    if (!parsed || typeof parsed !== "object") return null;
    if (!("answer" in parsed) || typeof parsed.answer !== "string") return null;
    const receiptIds =
      "receiptIds" in parsed && Array.isArray(parsed.receiptIds)
        ? parsed.receiptIds.filter((id): id is string => typeof id === "string")
        : [];
    return {
      answer: parsed.answer,
      receiptIds,
    };
  } catch {
    return null;
  }
}

function getMessageContent(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("choices" in payload)) {
    return null;
  }

  const choices = payload.choices;
  if (!Array.isArray(choices) || choices.length === 0) return null;

  const first = choices[0];
  if (!first || typeof first !== "object" || !("message" in first)) return null;

  const message = first.message;
  if (!message || typeof message !== "object" || !("content" in message)) {
    return null;
  }

  return typeof message.content === "string" ? message.content : null;
}

function citationsFromIds(
  receipts: ReceiptListItem[],
  receiptIds: string[]
): ReceiptChatResult["citations"] {
  const byId = new Map(receipts.map((receipt) => [receipt.id, receipt]));

  return receiptIds
    .map((id) => byId.get(id))
    .filter((receipt): receipt is ReceiptListItem => Boolean(receipt))
    .slice(0, 6)
    .map((receipt) => ({
      id: receipt.id,
      label: receipt.merchant,
      detail: `${receipt.receipt_date}: ${formatCurrency(
        Number(receipt.total),
        receipt.currency
      )}`,
    }));
}

export function isQwenReasoningConfigured() {
  return Boolean(process.env.QWEN_API_KEY);
}

export async function answerWithQwenReasoning(
  question: string,
  receipts: ReceiptReasoningRecord[]
): Promise<ReceiptChatResult | null> {
  const apiKey = process.env.QWEN_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${QWEN_BASE_URL.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: QWEN_REASONING_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You reason over receipt history and return compact JSON answers.",
        },
        {
          role: "user",
          content: buildPrompt(question, receipts),
        },
      ],
      temperature: 0.2,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Qwen reasoning failed with status ${response.status}${
        errorText ? `: ${errorText.slice(0, 500)}` : ""
      }`
    );
  }

  const content = getMessageContent(await response.json());
  if (!content) return null;

  const parsed = parseQwenJson(content);
  if (!parsed) {
    return {
      answer: content,
      citations: [],
    };
  }

  return {
    answer: parsed.answer,
    citations: citationsFromIds(receipts, parsed.receiptIds),
  };
}
