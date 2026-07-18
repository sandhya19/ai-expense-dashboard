import type {
  Receipt,
  SpendingDnaTrait,
  SpendingInsight,
  SpendingStory,
} from "@/lib/types";

const coffeeTerms = ["coffee", "cafe", "starbucks", "pret", "costa"];
const foodTerms = ["meal", "dining", "restaurant", "food", "grocer", "supermarket"];
const travelTerms = ["travel", "uber", "train", "flight", "hotel"];
const valueTerms = ["lidl", "aldi", "discount", "clubcard", "sale"];
const subscriptionTerms = ["netflix", "spotify", "amazon prime", "adobe", "apple", "microsoft", "google", "zoom"];

function amount(receipt: Receipt) {
  return Number(receipt.total);
}

function isInMonth(receipt: Receipt, year: number, month: number) {
  const date = new Date(`${receipt.receipt_date}T12:00:00`);
  return date.getFullYear() === year && date.getMonth() === month;
}

function includesAny(value: string, terms: string[]) {
  const normalized = value.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function categoryTotal(receipts: Receipt[], terms: string[]) {
  return receipts
    .filter((receipt) => includesAny(`${receipt.category} ${receipt.merchant}`, terms))
    .reduce((sum, receipt) => sum + amount(receipt), 0);
}

function score(part: number, total: number, multiplier = 220) {
  if (!total) return 0;
  return Math.min(100, Math.max(8, Math.round((part / total) * multiplier)));
}

export function buildSpendingDna(receipts: Receipt[]): SpendingDnaTrait[] {
  const total = receipts.reduce((sum, receipt) => sum + amount(receipt), 0);
  const coffee = categoryTotal(receipts, coffeeTerms);
  const food = categoryTotal(receipts, foodTerms);
  const travel = categoryTotal(receipts, travelTerms);
  const smartShopper = categoryTotal(receipts, valueTerms);

  return [
    { id: "coffee-explorer", label: "Coffee Explorer", description: "Cafés and coffee moments", score: score(coffee, total, 350) },
    { id: "food-lover", label: "Food Lover", description: "Meals, groceries, and dining", score: score(food, total, 250) },
    { id: "traveller", label: "Traveller", description: "Getting around and getting away", score: score(travel, total, 240) },
    { id: "smart-shopper", label: "Smart Shopper", description: "Value-led places and savings signals", score: score(smartShopper, total, 400) },
  ];
}

export function buildSpendingStory(receipts: Receipt[], now = new Date()): SpendingStory {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const previous = new Date(currentYear, currentMonth - 1, 1);
  const currentReceipts = receipts.filter((receipt) => isInMonth(receipt, currentYear, currentMonth));
  const previousReceipts = receipts.filter((receipt) =>
    isInMonth(receipt, previous.getFullYear(), previous.getMonth())
  );
  const total = currentReceipts.reduce((sum, receipt) => sum + amount(receipt), 0);
  const previousTotal = previousReceipts.reduce((sum, receipt) => sum + amount(receipt), 0);
  const changePercent = previousTotal > 0 ? Math.round(((total - previousTotal) / previousTotal) * 100) : null;
  const insights: SpendingInsight[] = [];

  if (changePercent !== null) {
    const direction = changePercent >= 0 ? "more" : "less";
    insights.push({
      id: "monthly-spend",
      insight_type: "monthly_comparison",
      title: `You spent ${Math.abs(changePercent)}% ${direction} this month`,
      description: `Your tracked spending is ${direction} than last month.`,
      supporting_data: `This month: £${total.toFixed(2)} · Last month: £${previousTotal.toFixed(2)}`,
      recommendation: changePercent > 10 ? "Open your recent purchases to see what changed." : "Keep noticing the habits behind this steady rhythm.",
      impact: Math.abs(changePercent) > 20 ? "high" : "medium",
      confidence: 0.98,
    });
  }

  const categories = new Map<string, number>();
  currentReceipts.forEach((receipt) => categories.set(receipt.category, (categories.get(receipt.category) ?? 0) + amount(receipt)));
  const topCategory = Array.from(categories.entries()).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && total > 0) {
    const share = Math.round((topCategory[1] / total) * 100);
    insights.push({
      id: "category-focus",
      insight_type: "spending_pattern",
      title: `${topCategory[0]} shaped your month`,
      description: `It accounts for ${share}% of your tracked spending so far.`,
      supporting_data: `£${topCategory[1].toFixed(2)} across ${currentReceipts.filter((receipt) => receipt.category === topCategory[0]).length} receipts`,
      recommendation: "Compare a few purchases in this category before your next spend.",
      impact: share >= 35 ? "high" : "medium",
      confidence: 0.96,
    });
  }

  const coffeeSpend = categoryTotal(currentReceipts, coffeeTerms);
  if (coffeeSpend > 0) {
    insights.push({
      id: "coffee-moment",
      insight_type: "spending_pattern",
      title: "Your coffee moments are adding up",
      description: "Small routines can be the clearest window into everyday spending.",
      supporting_data: `£${coffeeSpend.toFixed(2)} this month`,
      recommendation: "Try one home coffee day this week if you want to create a little breathing room.",
      impact: "low",
      confidence: 0.9,
    });
  }

  if (currentReceipts.length >= 3) {
    const spendByDay = new Map<string, { amount: number; purchases: number }>();
    currentReceipts.forEach((receipt) => {
      const day = new Intl.DateTimeFormat("en-GB", { weekday: "long" }).format(
        new Date(`${receipt.receipt_date}T12:00:00`)
      );
      const previous = spendByDay.get(day) ?? { amount: 0, purchases: 0 };
      spendByDay.set(day, { amount: previous.amount + amount(receipt), purchases: previous.purchases + 1 });
    });
    const biggestDay = Array.from(spendByDay.entries()).sort(([, left], [, right]) => right.amount - left.amount)[0];
    if (biggestDay) {
      const [day, details] = biggestDay;
      insights.push({
        id: "spending-rhythm",
        insight_type: "spending_pattern",
        title: `${day} is your biggest spending day`,
        description: "Your receipt history has started to reveal a weekly rhythm.",
        supporting_data: `${formatAmount(details.amount)} across ${details.purchases} purchase${details.purchases === 1 ? "" : "s"}`,
        recommendation: "Plan one small pause before your next usual spending day if you want more room in the week.",
        impact: "low",
        confidence: 0.86,
      });
    }
  }

  const recurringMerchants = new Map<string, Receipt[]>();
  receipts.forEach((receipt) => {
    const merchant = receipt.merchant.toLowerCase();
    if (subscriptionTerms.some((term) => merchant.includes(term))) {
      recurringMerchants.set(receipt.merchant, [...(recurringMerchants.get(receipt.merchant) ?? []), receipt]);
    }
  });
  const subscription = Array.from(recurringMerchants.entries()).find(([, purchases]) => purchases.length >= 2);
  if (subscription) {
    const [merchant, purchases] = subscription;
    const monthlyAmount = amount(purchases.at(-1)!);
    insights.push({
      id: `recurring-${merchant.toLowerCase().replace(/\W+/g, "-")}`,
      insight_type: "merchant_pattern",
      title: `${merchant} looks recurring`,
      description: "I found repeat purchases that may be part of a subscription.",
      supporting_data: `${purchases.length} payments · latest ${formatAmount(monthlyAmount)}`,
      recommendation: "Check whether this is still earning its place in your month.",
      impact: "medium",
      confidence: 0.82,
    });
  }

  if (insights.length === 0) {
    insights.push({
      id: "first-story",
      insight_type: "spending_pattern",
      title: "Your spending story is just beginning",
      description: "Each receipt adds another useful detail about the habits behind your money.",
      supporting_data: `${receipts.length} receipt${receipts.length === 1 ? "" : "s"} analysed`,
      recommendation: "Upload your next receipt to unlock your first comparison.",
      impact: "low",
      confidence: 1,
    });
  }

  return {
    periodLabel: new Intl.DateTimeFormat("en-GB", { month: "long" }).format(now),
    total,
    previousTotal: previousTotal || null,
    changePercent,
    insights: insights.slice(0, 4),
  };
}

function formatAmount(value: number) {
  return `£${value.toFixed(2)}`;
}
