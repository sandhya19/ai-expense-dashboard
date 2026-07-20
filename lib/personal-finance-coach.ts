import type { DashboardData, Receipt } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export type FinanceCoachInsight = {
  id: string;
  title: string;
  detail: string;
  impact: string;
  kind: "duplicate" | "subscription" | "comparison" | "overspending";
};

const subscriptionMerchants = [
  "adobe",
  "amazon prime",
  "apple",
  "aws",
  "google",
  "microsoft",
  "netflix",
  "spotify",
  "zoom",
];

const categoryLimits: Record<string, number> = {
  Dining: 250,
  Meals: 250,
  Shopping: 300,
  Travel: 500,
  Entertainment: 180,
  Software: 150,
  Office: 180,
  Other: 200,
};

function receiptAmount(receipt: Receipt) {
  return Number(receipt.total);
}

function getCategoryAmount(data: DashboardData, categoryName: string) {
  const category = data.categories.find((item) => item.name === categoryName);
  if (!category || data.metrics.totalSpending <= 0) return 0;
  return (data.metrics.totalSpending * category.value) / 100;
}

function findDuplicatePurchase(receipts: Receipt[]): FinanceCoachInsight | null {
  const seen = new Map<string, Receipt>();

  for (const receipt of receipts) {
    const key = `${receipt.merchant.toLowerCase()}-${receiptAmount(receipt).toFixed(2)}`;
    const previous = seen.get(key);

    if (previous) {
      const daysApart = Math.abs(
        (new Date(receipt.receipt_date).getTime() -
          new Date(previous.receipt_date).getTime()) /
          86_400_000
      );

      if (daysApart <= 14) {
        return {
          id: "duplicate-purchase",
          title: "Duplicate purchase",
          detail: `${receipt.merchant} appears more than once for ${formatCurrency(receiptAmount(receipt))} within ${Math.max(1, Math.round(daysApart))} days.`,
          impact: "Review duplicate",
          kind: "duplicate",
        };
      }
    }

    seen.set(key, receipt);
  }

  return null;
}

function findSubscription(receipts: Receipt[]): FinanceCoachInsight | null {
  const match = receipts.find((receipt) => {
    const merchant = receipt.merchant.toLowerCase();
    const category = receipt.category.toLowerCase();
    return (
      subscriptionMerchants.some((name) => merchant.includes(name)) ||
      category.includes("software") ||
      category.includes("subscription")
    );
  });

  if (!match) return null;

  return {
    id: "subscription-detected",
    title: "Subscription detected",
    detail: `${match.merchant} looks like a recurring expense from your receipt history.`,
    impact: `${formatCurrency(receiptAmount(match) * 12)} annualized`,
    kind: "subscription",
  };
}

function getMonthlyComparison(data: DashboardData): FinanceCoachInsight | null {
  const months = data.monthly.filter((month) => month.amount > 0);
  const latest = months.at(-1);
  const previous = months.at(-2);

  if (!latest || !previous) return null;

  const change = latest.amount - previous.amount;
  const percent = previous.amount > 0 ? Math.round((change / previous.amount) * 100) : 0;
  const direction = change >= 0 ? "higher" : "lower";

  return {
    id: "monthly-comparison",
    title: "Monthly comparison",
    detail: `${latest.month} spending is ${Math.abs(percent)}% ${direction} than ${previous.month}.`,
    impact: `${formatCurrency(Math.abs(change))} ${direction}`,
    kind: "comparison",
  };
}

function getOverspendingAlert(data: DashboardData): FinanceCoachInsight | null {
  const categories = data.categories
    .map((category) => {
      const amount = getCategoryAmount(data, category.name);
      const limit = categoryLimits[category.name] ?? 250;
      return {
        name: category.name,
        amount,
        limit,
        overBy: amount - limit,
      };
    })
    .filter((category) => category.overBy > 0)
    .sort((a, b) => b.overBy - a.overBy);

  const highest = categories[0];
  if (!highest) return null;

  return {
    id: "overspending-alert",
    title: "Overspending alert",
    detail: `${highest.name} is over the default monthly target of ${formatCurrency(highest.limit)}.`,
    impact: `${formatCurrency(highest.overBy)} over`,
    kind: "overspending",
  };
}

function fallbackInsight(data: DashboardData): FinanceCoachInsight {
  const topCategory = data.categories[0];

  return {
    id: "category-focus",
    title: "Category focus",
    detail: topCategory
      ? `${topCategory.name} is currently your largest spending category.`
      : "Upload more receipts to unlock stronger spending insights.",
    impact: topCategory ? `${topCategory.value}% of spend` : "More data needed",
    kind: "comparison",
  };
}

export function generatePersonalFinanceInsights(
  data: DashboardData
): FinanceCoachInsight[] {
  const insights = [
    findDuplicatePurchase(data.recent),
    findSubscription(data.recent),
    getMonthlyComparison(data),
    getOverspendingAlert(data),
  ].filter((insight): insight is FinanceCoachInsight => Boolean(insight));

  return insights.length > 0 ? insights : [fallbackInsight(data)];
}
