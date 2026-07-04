import { format } from "date-fns";
import { Eye } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Receipt } from "@/lib/types";
import { cn, formatCurrency } from "@/lib/utils";

const statusStyles = {
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export function RecentDocuments({
  receipts,
}: {
  receipts: Receipt[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent documents</CardTitle>
      </CardHeader>

      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              {[
                "Merchant",
                "Date",
                "Category",
                "Total",
                "Confidence",
                "Status",
                "Action",
              ].map((head) => (
                <th
                  key={head}
                  className="pb-3 font-medium"
                >
                  {head}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {receipts.map((item) => (
              <tr
                key={item.id}
                className="border-b last:border-0"
              >
                <td className="py-4 font-medium">{item.merchant}</td>
                <td>{format(new Date(item.receipt_date), "dd MMM yyyy")}</td>
                <td>{item.category}</td>
                <td>{formatCurrency(Number(item.total))}</td>
                <td>
                  <span className="font-medium">{item.confidence}%</span>
                </td>
                <td>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                      statusStyles[item.status]
                    )}
                  >
                    {item.status}
                  </span>
                </td>
                <td>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                  >
                    <Link href={`/documents/${item.id}`}>
                      <Eye className="size-4" />
                      Review
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
