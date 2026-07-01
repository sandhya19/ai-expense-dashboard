import { BriefcaseBusiness, CalendarDays, ReceiptText, WalletCards } from "lucide-react";
import { DashboardCharts } from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentDocuments } from "@/components/dashboard/recent-documents";
import { getDashboardData } from "@/lib/dashboard";
import { formatCurrency } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getDashboardData();
  return <div className="space-y-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">Expense dashboard</h1><p className="mt-1 text-sm text-muted-foreground">Track receipts, spending, and AI extraction quality.</p></div><QuickActions /></div><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><MetricCard title="Total receipts" value={String(data.metrics.totalReceipts)} detail="12 added this month" icon={ReceiptText} /><MetricCard title="Total spending" value={formatCurrency(data.metrics.totalSpending)} detail="8.2% from last period" icon={WalletCards} /><MetricCard title="This month" value={formatCurrency(data.metrics.thisMonth)} detail="Within monthly budget" icon={CalendarDays} /><MetricCard title="Business expenses" value={formatCurrency(data.metrics.businessExpenses)} detail="68% of total spending" icon={BriefcaseBusiness} /></section><DashboardCharts monthly={data.monthly} categories={data.categories} merchants={data.merchants} /><RecentDocuments receipts={data.recent} /></div>;
}
