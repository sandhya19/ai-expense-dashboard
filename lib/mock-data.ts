import type { DashboardData } from "@/lib/types";

export const mockDashboardData: DashboardData = {
  metrics: { totalReceipts: 248, totalSpending: 18492.37, thisMonth: 2841.64, businessExpenses: 12604.21 },
  monthly: [
    { month: "Jan", amount: 1760 }, { month: "Feb", amount: 2210 }, { month: "Mar", amount: 1980 },
    { month: "Apr", amount: 2690 }, { month: "May", amount: 2420 }, { month: "Jun", amount: 2842 }
  ],
  categories: [
    { name: "Travel", value: 32 }, { name: "Meals", value: 24 }, { name: "Software", value: 19 },
    { name: "Office", value: 15 }, { name: "Other", value: 10 }
  ],
  merchants: [
    { merchant: "British Airways", amount: 2440 }, { merchant: "Amazon", amount: 1820 },
    { merchant: "Adobe", amount: 1390 }, { merchant: "Uber", amount: 910 }, { merchant: "Pret", amount: 680 }
  ],
  recent: [
    { id: "1", merchant: "British Airways", receipt_date: "2026-06-28", category: "Travel", total: 482.5, confidence: 98, status: "completed", is_business: true, created_at: "2026-06-28T12:00:00Z" },
    { id: "2", merchant: "Amazon Business", receipt_date: "2026-06-27", category: "Office", total: 76.99, confidence: 94, status: "review", is_business: true, created_at: "2026-06-27T12:00:00Z" },
    { id: "3", merchant: "Pret A Manger", receipt_date: "2026-06-26", category: "Meals", total: 18.45, confidence: 99, status: "completed", is_business: false, created_at: "2026-06-26T12:00:00Z" },
    { id: "4", merchant: "Adobe", receipt_date: "2026-06-25", category: "Software", total: 59.99, confidence: 97, status: "completed", is_business: true, created_at: "2026-06-25T12:00:00Z" },
    { id: "5", merchant: "Uber", receipt_date: "2026-06-24", category: "Travel", total: 32.8, confidence: 89, status: "processing", is_business: true, created_at: "2026-06-24T12:00:00Z" }
  ]
};
