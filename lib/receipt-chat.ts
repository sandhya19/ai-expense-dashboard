import type { ReceiptListItem } from "@/lib/receipts";
import { formatCurrency } from "@/lib/utils";

export type ReceiptChatResult = {
  answer: string;
  citations: Array<{
    id: string;
    label: string;
    detail: string;
  }>;
};

function receiptAmount(receipt: ReceiptListItem) {
  return Number(receipt.total);
}

function sortByDate(receipts: ReceiptListItem[]) {
  return [...receipts].sort(
    (a, b) => new Date(a.receipt_date).getTime() - new Date(b.receipt_date).getTime()
  );
}

function getAmountThreshold(query: string) {
  const match = query.match(/(?:over|above|greater than|more than)\s+[£$]?\s*(\d+(?:\.\d+)?)/i);
  return match ? Number(match[1]) : null;
}

function getMerchantTrend(receipts: ReceiptListItem[]): ReceiptChatResult {
  const byMerchant = new Map<string, ReceiptListItem[]>();

  receipts.forEach((receipt) => {
    const key = receipt.merchant.trim();
    byMerchant.set(key, [...(byMerchant.get(key) ?? []), receipt]);
  });

  const trends = Array.from(byMerchant, ([merchant, merchantReceipts]) => {
    const sorted = sortByDate(merchantReceipts);
    if (sorted.length < 2) return null;

    const midpoint = Math.floor(sorted.length / 2);
    const earlier = sorted.slice(0, midpoint);
    const later = sorted.slice(midpoint);
    const earlierAverage =
      earlier.reduce((sum, receipt) => sum + receiptAmount(receipt), 0) / earlier.length;
    const laterAverage =
      later.reduce((sum, receipt) => sum + receiptAmount(receipt), 0) / later.length;
    const change = laterAverage - earlierAverage;

    return {
      merchant,
      earlierAverage,
      laterAverage,
      change,
      receipts: sorted,
    };
  })
    .filter((trend): trend is NonNullable<typeof trend> => Boolean(trend))
    .sort((a, b) => b.change - a.change);

  const rising = trends.find((trend) => trend.change > 0);

  if (!rising) {
    return {
      answer:
        "I do not see a store becoming more expensive yet. ReceiptBrain needs at least two receipts from the same merchant with a rising average spend.",
      citations: [],
    };
  }

  return {
    answer: `${rising.merchant} looks like it is becoming more expensive. Your average receipt rose from ${formatCurrency(rising.earlierAverage)} to ${formatCurrency(rising.laterAverage)}, an increase of ${formatCurrency(rising.change)} per receipt.`,
    citations: rising.receipts.slice(-3).map((receipt) => ({
      id: receipt.id,
      label: receipt.merchant,
      detail: `${receipt.receipt_date}: ${formatCurrency(receiptAmount(receipt), receipt.currency)}`,
    })),
  };
}

function answerBiggestPurchase(receipts: ReceiptListItem[]): ReceiptChatResult {
  const largest = [...receipts].sort((a, b) => receiptAmount(b) - receiptAmount(a))[0];
  if (!largest) {
    return { answer: "No receipts are available yet.", citations: [] };
  }

  return {
    answer: `Your biggest purchase is ${formatCurrency(receiptAmount(largest), largest.currency)} at ${largest.merchant}.`,
    citations: [
      {
        id: largest.id,
        label: largest.merchant,
        detail: `${largest.receipt_date}: ${largest.category}`,
      },
    ],
  };
}

function answerReceiptsOver(
  receipts: ReceiptListItem[],
  threshold: number
): ReceiptChatResult {
  const matches = receipts.filter((receipt) => receiptAmount(receipt) > threshold);
  const total = matches.reduce((sum, receipt) => sum + receiptAmount(receipt), 0);

  return {
    answer: matches.length
      ? `I found ${matches.length} receipt${matches.length === 1 ? "" : "s"} over ${formatCurrency(threshold)}, totaling ${formatCurrency(total)}.`
      : `I did not find receipts over ${formatCurrency(threshold)}.`,
    citations: matches.slice(0, 5).map((receipt) => ({
      id: receipt.id,
      label: receipt.merchant,
      detail: `${receipt.receipt_date}: ${formatCurrency(receiptAmount(receipt), receipt.currency)}`,
    })),
  };
}

function answerCategoryOrMerchant(
  query: string,
  receipts: ReceiptListItem[]
): ReceiptChatResult | null {
  const categoryMatches = receipts.filter((receipt) =>
    query.includes(receipt.category.toLowerCase())
  );
  if (categoryMatches.length > 0) {
    const total = categoryMatches.reduce((sum, receipt) => sum + receiptAmount(receipt), 0);
    return {
      answer: `${categoryMatches[0].category} totals ${formatCurrency(total)} across ${categoryMatches.length} receipt${categoryMatches.length === 1 ? "" : "s"}.`,
      citations: categoryMatches.slice(0, 5).map((receipt) => ({
        id: receipt.id,
        label: receipt.merchant,
        detail: `${receipt.receipt_date}: ${formatCurrency(receiptAmount(receipt), receipt.currency)}`,
      })),
    };
  }

  const merchantMatches = receipts.filter((receipt) =>
    query.includes(receipt.merchant.toLowerCase())
  );
  if (merchantMatches.length > 0) {
    const total = merchantMatches.reduce((sum, receipt) => sum + receiptAmount(receipt), 0);
    return {
      answer: `You spent ${formatCurrency(total)} at ${merchantMatches[0].merchant} across ${merchantMatches.length} receipt${merchantMatches.length === 1 ? "" : "s"}.`,
      citations: merchantMatches.slice(0, 5).map((receipt) => ({
        id: receipt.id,
        label: receipt.merchant,
        detail: `${receipt.receipt_date}: ${formatCurrency(receiptAmount(receipt), receipt.currency)}`,
      })),
    };
  }

  return null;
}

function answerSubscriptions(receipts: ReceiptListItem[]): ReceiptChatResult {
  const knownSubscriptions = [
    "netflix",
    "spotify",
    "amazon prime",
    "adobe",
    "apple",
    "microsoft",
    "google",
    "zoom",
  ];
  const matches = receipts.filter((receipt) => {
    const value = `${receipt.merchant} ${receipt.category}`.toLowerCase();
    return knownSubscriptions.some((merchant) => value.includes(merchant)) || value.includes("subscription");
  });

  if (!matches.length) {
    return { answer: "I have not found a clear recurring subscription in the receipts I can see yet.", citations: [] };
  }

  const merchants = [...new Set(matches.map((receipt) => receipt.merchant))];
  const monthlyEstimate = matches.reduce((sum, receipt) => sum + receiptAmount(receipt), 0);
  return {
    answer: `I found ${merchants.join(", ")}. The receipts I can see total ${formatCurrency(monthlyEstimate)}; review the linked receipts to confirm each renewal cycle.`,
    citations: matches.slice(0, 6).map((receipt) => ({ id: receipt.id, label: receipt.merchant, detail: `${receipt.receipt_date}: ${formatCurrency(receiptAmount(receipt), receipt.currency)}` })),
  };
}

function answerCoffeeSpend(receipts: ReceiptListItem[]): ReceiptChatResult {
  const matches = receipts.filter((receipt) =>
    /coffee|cafe|starbucks|costa/i.test(`${receipt.merchant} ${receipt.category}`)
  );
  const total = matches.reduce((sum, receipt) => sum + receiptAmount(receipt), 0);
  return {
    answer: matches.length
      ? `You spent ${formatCurrency(total)} on coffee across ${matches.length} purchase${matches.length === 1 ? "" : "s"}. Your average coffee moment was ${formatCurrency(total / matches.length)}.`
      : "I could not identify a coffee purchase from the receipts I can see yet. Categorising café line items will make this sharper over time.",
    citations: matches.slice(0, 6).map((receipt) => ({ id: receipt.id, label: receipt.merchant, detail: `${receipt.receipt_date}: ${formatCurrency(receiptAmount(receipt), receipt.currency)}` })),
  };
}

export function answerReceiptQuestion(
  question: string,
  receipts: ReceiptListItem[]
): ReceiptChatResult {
  const query = question.trim().toLowerCase();

  if (!query) {
    return {
      answer: "Ask a question about your receipts, stores, categories, or larger purchases.",
      citations: [],
    };
  }

  if (receipts.length === 0) {
    return {
      answer: "Upload receipts first so ReceiptBrain can answer questions about your spending.",
      citations: [],
    };
  }

  if (
    query.includes("more expensive") ||
    query.includes("price increase") ||
    query.includes("getting expensive") ||
    query.includes("becoming expensive")
  ) {
    return getMerchantTrend(receipts);
  }

  if (query.includes("biggest") || query.includes("largest")) {
    return answerBiggestPurchase(receipts);
  }

  if (query.includes("subscription") || query.includes("recurring")) {
    return answerSubscriptions(receipts);
  }

  if (query.includes("coffee")) {
    return answerCoffeeSpend(receipts);
  }

  const threshold = getAmountThreshold(query);
  if (threshold !== null) {
    return answerReceiptsOver(receipts, threshold);
  }

  const categoryOrMerchant = answerCategoryOrMerchant(query, receipts);
  if (categoryOrMerchant) {
    return categoryOrMerchant;
  }

  return {
    answer:
      "I can answer questions about stores becoming more expensive, biggest purchases, receipts over an amount, and spending by merchant or category.",
    citations: [],
  };
}
