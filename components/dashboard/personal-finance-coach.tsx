import {
  AlertTriangle,
  Copy,
  Lightbulb,
  Repeat,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  generatePersonalFinanceInsights,
  type FinanceCoachInsight,
} from "@/lib/personal-finance-coach";
import type { DashboardData } from "@/lib/types";
import { cn } from "@/lib/utils";

const insightIcons = {
  duplicate: Copy,
  subscription: Repeat,
  comparison: TrendingUp,
  overspending: AlertTriangle,
};

const insightStyles: Record<FinanceCoachInsight["kind"], string> = {
  duplicate: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  subscription: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  comparison: "bg-violet-500/10 text-violet-700 dark:text-violet-400",
  overspending: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function PersonalFinanceCoach({
  data,
}: {
  data: DashboardData;
}) {
  const insights = generatePersonalFinanceInsights(data);

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <CardTitle>AI personal finance coach</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Intelligent receipt insights for duplicate purchases, subscriptions, monthly changes, and overspending.
          </p>
        </div>

        <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Lightbulb className="size-3.5" />
          Generated from receipts
        </span>
      </CardHeader>

      <CardContent>
        {insights.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <Lightbulb className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 text-sm font-medium">
              Upload more receipts to unlock coaching insights.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              ReceiptBrain needs spending history before it can summarize trends.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {insights.map((insight) => {
              const Icon = insightIcons[insight.kind];

              return (
                <div
                  key={insight.id}
                  className="rounded-lg border p-4"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-lg",
                        insightStyles[insight.kind]
                      )}
                    >
                      <Icon className="size-5" />
                    </span>

                    <div className="min-w-0">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="text-sm font-semibold">
                          {insight.title}
                        </h2>
                        <span className="w-fit rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                          {insight.impact}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-muted-foreground">
                        {insight.detail}
                      </p>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
