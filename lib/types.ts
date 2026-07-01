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
};
