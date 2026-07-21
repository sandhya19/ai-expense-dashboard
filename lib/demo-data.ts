import type { ReceiptReasoningRecord } from "@/lib/receipts";
import type { DashboardData, Receipt } from "@/lib/types";

const completed = {
  confidence: 98,
  status: "completed" as const,
  is_business: false,
  processing_status: "completed" as const,
  original_filename: null,
  updated_at: null,
};

export const demoReceipts: ReceiptReasoningRecord[] = [
  { id: "demo-groceries-july", merchant: "Harbour Grocers", receipt_date: "2026-07-19", category: "Groceries", total: 64.2, currency: "GBP", created_at: "2026-07-19T10:10:00Z", ...completed, items: [{ id: "demo-item-1", description: "Fresh vegetables", quantity: 1, unit_price: 14.8, total: 14.8 }, { id: "demo-item-2", description: "Household staples", quantity: 1, unit_price: 49.4, total: 49.4 }] },
  { id: "demo-restaurant-july", merchant: "Juniper Table", receipt_date: "2026-07-18", category: "Dining", total: 42.8, currency: "GBP", created_at: "2026-07-18T19:30:00Z", ...completed, items: [{ id: "demo-item-3", description: "Dinner for two", quantity: 1, unit_price: 42.8, total: 42.8 }] },
  { id: "demo-travel-july", merchant: "CityLine Rail", receipt_date: "2026-07-17", category: "Travel", total: 24.5, currency: "GBP", created_at: "2026-07-17T08:10:00Z", ...completed, items: [{ id: "demo-item-4", description: "Return journey", quantity: 1, unit_price: 24.5, total: 24.5 }] },
  { id: "demo-subscription-july", merchant: "FocusFlow", receipt_date: "2026-07-15", category: "Subscriptions", total: 10.99, currency: "GBP", created_at: "2026-07-15T09:00:00Z", ...completed, items: [{ id: "demo-item-5", description: "Monthly membership", quantity: 1, unit_price: 10.99, total: 10.99 }] },
  { id: "demo-coffee-july", merchant: "Northstar Coffee", receipt_date: "2026-07-12", category: "Coffee", total: 4.6, currency: "GBP", created_at: "2026-07-12T09:15:00Z", ...completed, items: [{ id: "demo-item-6", description: "Oat latte", quantity: 1, unit_price: 4.6, total: 4.6 }] },
  { id: "demo-groceries-june", merchant: "Harbour Grocers", receipt_date: "2026-06-21", category: "Groceries", total: 51.4, currency: "GBP", created_at: "2026-06-21T10:10:00Z", ...completed, items: [{ id: "demo-item-7", description: "Weekly groceries", quantity: 1, unit_price: 51.4, total: 51.4 }] },
  { id: "demo-restaurant-june", merchant: "Juniper Table", receipt_date: "2026-06-18", category: "Dining", total: 35.5, currency: "GBP", created_at: "2026-06-18T19:30:00Z", ...completed, items: [{ id: "demo-item-8", description: "Dinner", quantity: 1, unit_price: 35.5, total: 35.5 }] },
  { id: "demo-travel-june", merchant: "CityLine Rail", receipt_date: "2026-06-16", category: "Travel", total: 24.5, currency: "GBP", created_at: "2026-06-16T08:10:00Z", ...completed, items: [{ id: "demo-item-9", description: "Return journey", quantity: 1, unit_price: 24.5, total: 24.5 }] },
  { id: "demo-subscription-june", merchant: "FocusFlow", receipt_date: "2026-06-15", category: "Subscriptions", total: 10.99, currency: "GBP", created_at: "2026-06-15T09:00:00Z", ...completed, items: [{ id: "demo-item-10", description: "Monthly membership", quantity: 1, unit_price: 10.99, total: 10.99 }] },
];

function toDashboardReceipt(receipt: ReceiptReasoningRecord): Receipt {
  return {
    id: receipt.id,
    merchant: receipt.merchant,
    receipt_date: receipt.receipt_date,
    category: receipt.category,
    total: Number(receipt.total),
    confidence: receipt.confidence,
    status: receipt.status,
    is_business: receipt.is_business,
    created_at: receipt.created_at,
  };
}

export const demoDashboardData: DashboardData = {
  metrics: { totalReceipts: demoReceipts.length, totalSpending: 269.48, thisMonth: 147.09, businessExpenses: 0 },
  monthly: [{ month: "Jun", amount: 122.39 }, { month: "Jul", amount: 147.09 }],
  categories: [{ name: "Groceries", value: 43 }, { name: "Dining", value: 29 }, { name: "Travel", value: 18 }, { name: "Subscriptions", value: 8 }, { name: "Coffee", value: 2 }],
  merchants: [{ merchant: "Harbour Grocers", amount: 115.6 }, { merchant: "Juniper Table", amount: 78.3 }, { merchant: "CityLine Rail", amount: 49 }, { merchant: "FocusFlow", amount: 21.98 }, { merchant: "Northstar Coffee", amount: 4.6 }],
  recent: demoReceipts.slice(0, 5).map(toDashboardReceipt),
  story: { periodLabel: "July", total: 147.09, previousTotal: 122.39, changePercent: 20, insights: [
    { id: "demo-monthly", insight_type: "monthly_comparison", title: "You tracked 20% more this month", description: "Your July receipt total is higher than June, led by everyday food spending.", supporting_data: "£147.09 in July · £122.39 in June", recommendation: "Before your next grocery shop, make a short list so the increase stays intentional.", impact: "medium", confidence: 0.98 },
    { id: "demo-groceries", insight_type: "spending_pattern", title: "Groceries are your biggest money moment", description: "They make up 44% of the receipt spending in this sample.", supporting_data: "£115.60 across 2 receipts", recommendation: "Compare your next basket with the two cited shops before you check out.", impact: "medium", confidence: 0.96 },
    { id: "demo-subscription", insight_type: "merchant_pattern", title: "FocusFlow looks recurring", description: "Two equal monthly payments suggest an active subscription.", supporting_data: "£10.99 in June and July", recommendation: "Decide whether it is still useful before the next renewal.", impact: "low", confidence: 0.9 },
  ] },
  dna: [
    { id: "coffee-explorer", label: "Coffee Explorer", description: "Cafés and coffee moments", score: 8 },
    { id: "food-lover", label: "Food Lover", description: "Meals, groceries, and dining", score: 82 },
    { id: "traveller", label: "Traveller", description: "Getting around and getting away", score: 40 },
    { id: "smart-shopper", label: "Smart Shopper", description: "Value-led places and savings signals", score: 35 },
  ],
};
