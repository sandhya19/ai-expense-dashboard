import { format } from "date-fns";
import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getReceiptList } from "@/lib/receipts";
import { cn, formatCurrency } from "@/lib/utils";

const statusStyles = {
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

export default async function DocumentsPage() {
  const receipts = await getReceiptList();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-muted-foreground">
          Review uploaded receipts, extraction status, and corrected fields.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Receipts</CardTitle>
        </CardHeader>

        <CardContent>
          {receipts.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-lg border border-dashed text-center">
              <div>
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No receipts yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Upload a receipt from the dashboard to start processing.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    {[
                      "Merchant",
                      "Date",
                      "Category",
                      "Total",
                      "AI status",
                      "Dashboard status",
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
                  {receipts.map((receipt) => (
                    <tr
                      key={receipt.id}
                      className="border-b last:border-0"
                    >
                      <td className="py-4 font-medium">
                        {receipt.merchant}
                        {receipt.original_filename && (
                          <p className="mt-1 max-w-56 truncate text-xs font-normal text-muted-foreground">
                            {receipt.original_filename}
                          </p>
                        )}
                      </td>
                      <td>
                        {format(
                          new Date(receipt.receipt_date),
                          "dd MMM yyyy"
                        )}
                      </td>
                      <td>{receipt.category}</td>
                      <td>
                        {formatCurrency(
                          Number(receipt.total),
                          receipt.currency
                        )}
                      </td>
                      <td>
                        <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium capitalize">
                          {receipt.processing_status ?? "unknown"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
                            statusStyles[receipt.status]
                          )}
                        >
                          {receipt.status}
                        </span>
                      </td>
                      <td>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link href={`/documents/${receipt.id}`}>
                            <Eye className="size-4" />
                            Review
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
