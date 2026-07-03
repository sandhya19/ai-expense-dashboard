import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type ReceiptFileRouteProps = {
  params: Promise<{
    id: string;
  }>;
};

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function contentDisposition(filename: string, download: boolean) {
  const disposition = download ? "attachment" : "inline";
  const safeFilename = filename.replace(/["\r\n]/g, "_");

  return `${disposition}; filename="${safeFilename}"`;
}

export async function GET(
  request: Request,
  { params }: ReceiptFileRouteProps
) {
  try {
    const [{ id }, url] = await Promise.all([
      params,
      Promise.resolve(new URL(request.url)),
    ]);

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Sign in is required.", 401);
    }

    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .select("storage_path, original_filename, mime_type")
      .eq("id", id)
      .single();

    if (receiptError || !receipt?.storage_path) {
      return errorResponse("Receipt file was not found.", 404);
    }

    const { data: file, error: storageError } = await supabase.storage
      .from("receipts")
      .download(receipt.storage_path);

    if (storageError || !file) {
      return errorResponse("Receipt file could not be loaded.", 404);
    }

    const body = await file.arrayBuffer();
    const filename = receipt.original_filename ?? "receipt";
    const download = url.searchParams.get("download") === "1";

    return new Response(body, {
      headers: {
        "Cache-Control": "private, max-age=60",
        "Content-Disposition": contentDisposition(filename, download),
        "Content-Type": receipt.mime_type ?? file.type,
      },
    });
  } catch (error) {
    console.error("GET /api/documents/[id]/file failed:", error);

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Receipt file request failed.",
      500
    );
  }
}
