import { format } from "date-fns";
import { Eye, FileText } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getReceiptList } from "@/lib/receipts";
import { cn, formatCurrency } from "@/lib/utils";

type DocumentsPageProps = {
  searchParams: Promise<{
    merchant?: string;
    category?: string;
    dateFrom?: string;
    dateTo?: string;
    minAmount?: string;
    maxAmount?: string;
    demo?: string;
  }>;
};

const statusStyles = {
  completed: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  processing: "bg-blue-500/10 text-blue-700 dark:text-blue-400",
  review: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  failed: "bg-red-500/10 text-red-700 dark:text-red-400",
};

function filterReceipts(
  receipts: Awaited<ReturnType<typeof getReceiptList>>,
  filters: Awaited<DocumentsPageProps["searchParams"]>
) {
  const merchant = filters.merchant?.trim().toLowerCase() ?? "";
  const category = filters.category?.trim().toLowerCase() ?? "";
  const minAmount = filters.minAmount ? Number(filters.minAmount) : null;
  const maxAmount = filters.maxAmount ? Number(filters.maxAmount) : null;
  const dateFrom = filters.dateFrom ? new Date(filters.dateFrom) : null;
  const dateTo = filters.dateTo ? new Date(filters.dateTo) : null;

  return receipts.filter((receipt) => {
    const receiptDate = new Date(receipt.receipt_date);
    const total = Number(receipt.total);

    return (
      (!merchant || receipt.merchant.toLowerCase().includes(merchant)) &&
      (!category || receipt.category.toLowerCase().includes(category)) &&
      (!dateFrom || receiptDate >= dateFrom) &&
      (!dateTo || receiptDate <= dateTo) &&
      (minAmount === null || total >= minAmount) &&
      (maxAmount === null || total <= maxAmount)
    );
  });
}

export default async function DocumentsPage({
  searchParams,
}: DocumentsPageProps) {
  const [receipts, filters] = await Promise.all([
    getReceiptList((await searchParams).demo === "1"),
    searchParams,
  ]);
  const filteredReceipts = filterReceipts(receipts, filters);
  const demoMode = filters.demo === "1";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
        <p className="mt-1 text-muted-foreground">
          {demoMode ? "Explore fictional sample receipts and the evidence behind each insight." : "Review uploaded receipts, extraction status, and corrected fields."}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search receipts</CardTitle>
        </CardHeader>

        <CardContent>
          <form className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
            {demoMode && <input type="hidden" name="demo" value="1" />}
            <input
              name="merchant"
              defaultValue={filters.merchant ?? ""}
              placeholder="Merchant"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              name="category"
              defaultValue={filters.category ?? ""}
              placeholder="Category"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              name="dateFrom"
              type="date"
              defaultValue={filters.dateFrom ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              name="dateTo"
              type="date"
              defaultValue={filters.dateTo ?? ""}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              name="minAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={filters.minAmount ?? ""}
              placeholder="Min amount"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <input
              name="maxAmount"
              type="number"
              min="0"
              step="0.01"
              defaultValue={filters.maxAmount ?? ""}
              placeholder="Max amount"
              className="h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <div className="flex gap-2 md:col-span-3 xl:col-span-6">
              <Button type="submit">Apply filters</Button>
              <Button
                type="button"
                variant="outline"
                asChild
              >
                <Link href={demoMode ? "/documents?demo=1" : "/documents"}>Clear</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Receipts</CardTitle>
        </CardHeader>

        <CardContent>
          {filteredReceipts.length === 0 ? (
            <div className="grid min-h-64 place-items-center rounded-lg border border-dashed text-center">
              <div>
                <FileText className="mx-auto size-10 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">No matching receipts</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adjust filters or upload a new receipt from the dashboard.
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
                  {filteredReceipts.map((receipt) => (
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
                            {receipt.processing_status === "uploaded" ? "queued" : receipt.processing_status ?? "unknown"}
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
                            <Link href={`/documents/${receipt.id}${demoMode ? "?demo=1" : ""}`}>
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
