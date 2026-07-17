import { NextRequest, NextResponse } from "next/server";
import { getReceiptList } from "@/lib/receipts";

function validDate(value: string | null) {
  return value && !Number.isNaN(new Date(value).getTime()) ? value : null;
}

export async function GET(request: NextRequest) {
  try {
    const start = validDate(request.nextUrl.searchParams.get("start"));
    const end = validDate(request.nextUrl.searchParams.get("end"));
    const receipts = await getReceiptList();
    const filtered = receipts.filter((receipt) =>
      (!start || receipt.receipt_date >= start) && (!end || receipt.receipt_date <= end)
    );
    const group = (key: "merchant" | "category") => Object.entries(
      filtered.reduce<Record<string, number>>((result, receipt) => {
        result[receipt[key]] = (result[receipt[key]] ?? 0) + Number(receipt.total);
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total })).sort((a, b) => b.total - a.total);

    return NextResponse.json({ start, end, merchantTrends: group("merchant"), categoryTrends: group("category") });
  } catch (error) {
    console.error("Unable to load analytics trends:", error);
    return NextResponse.json({ error: "Unable to load analytics trends right now." }, { status: 500 });
  }
}
