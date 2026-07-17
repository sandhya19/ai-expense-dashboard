export type ReceiptStatus = "processing" | "review" | "completed" | "failed";

export type Receipt = {
  id: string;
  merchant: string;
  receipt_date: string;
  category: string;
  total: number;
  confidence: number;
  status: ReceiptStatus;
  is_business: boolean;
  created_at: string;
};

export type DashboardData = {
  metrics: {
    totalReceipts: number;
    totalSpending: number;
    thisMonth: number;
    businessExpenses: number;
  };
  monthly: Array<{ month: string; amount: number }>;
  categories: Array<{ name: string; value: number }>;
  merchants: Array<{ merchant: string; amount: number }>;
  recent: Receipt[];
  story: SpendingStory;
  dna: SpendingDnaTrait[];
};

export type SpendingInsight = {
  id: string;
  insight_type: "spending_pattern" | "monthly_comparison" | "merchant_pattern" | "saving_opportunity";
  title: string;
  description: string;
  supporting_data: string;
  recommendation: string;
  impact: "low" | "medium" | "high";
  confidence: number;
};

export type SpendingStory = {
  periodLabel: string;
  total: number;
  changePercent: number | null;
  previousTotal: number | null;
  insights: SpendingInsight[];
};

export type SpendingDnaTrait = {
  id: string;
  label: string;
  description: string;
  score: number;
};
