import "server-only";
import { createClient } from "@/lib/supabase/server";
import { mockDashboardData } from "@/lib/mock-data";
import { buildSpendingDna, buildSpendingStory } from "@/lib/spending-intelligence";
import type { DashboardData, Receipt, SpendingDnaProfile } from "@/lib/types";

const configured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function getReceipts(): Promise<Receipt[]> {
  if (!configured) return mockDashboardData.recent;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("receipts")
    .select("id,merchant,receipt_date,category,total,confidence,status,is_business,created_at")
    .order("receipt_date", { ascending: false });

  if (error) throw new Error(`Unable to load receipts: ${error.message}`);
  return (data ?? []) as Receipt[];
}

export async function getSpendingDnaProfile(): Promise<SpendingDnaProfile> {
  const receipts = await getReceipts();
  return { receipts, dna: buildSpendingDna(receipts) };
}

export async function getDashboardData(): Promise<DashboardData> {
  if (!configured) return mockDashboardData;
  const receipts = await getReceipts();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const totalSpending = receipts.reduce((sum, item) => sum + Number(item.total), 0);
  const thisMonth = receipts.filter((item) => new Date(item.receipt_date) >= monthStart).reduce((sum, item) => sum + Number(item.total), 0);
  const businessExpenses = receipts.filter((item) => item.is_business).reduce((sum, item) => sum + Number(item.total), 0);

  const monthlyMap = new Map<string, number>();
  const categoryMap = new Map<string, number>();
  const merchantMap = new Map<string, number>();

  receipts.forEach((item) => {
    const month = new Intl.DateTimeFormat("en-GB", { month: "short" }).format(new Date(item.receipt_date));
    monthlyMap.set(month, (monthlyMap.get(month) ?? 0) + Number(item.total));
    categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + Number(item.total));
    merchantMap.set(item.merchant, (merchantMap.get(item.merchant) ?? 0) + Number(item.total));
  });

  const categoryTotal = Array.from(categoryMap.values()).reduce((sum, value) => sum + value, 0) || 1;

  return {
    metrics: { totalReceipts: receipts.length, totalSpending, thisMonth, businessExpenses },
    monthly: Array.from(monthlyMap, ([month, amount]) => ({ month, amount })),
    categories: Array.from(categoryMap, ([name, amount]) => ({ name, value: Math.round((amount / categoryTotal) * 100) })),
    merchants: Array.from(merchantMap, ([merchant, amount]) => ({ merchant, amount })).sort((a, b) => b.amount - a.amount).slice(0, 5),
    recent: receipts.slice(0, 8),
    story: buildSpendingStory(receipts),
    dna: buildSpendingDna(receipts),
  };
}
