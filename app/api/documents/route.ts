import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "application/pdf",
]);

function errorResponse(error: string, status: number) {
  return NextResponse.json({ error }, { status });
}

function getFastApiError(body: unknown, fallback: string) {
  if (
    body &&
    typeof body === "object" &&
    "detail" in body &&
    typeof body.detail === "string"
  ) {
    return body.detail;
  }

  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    typeof body.error === "string"
  ) {
    return body.error;
  }

  return fallback;
}

export async function POST(request: Request) {
  try {
    const receiptServiceUrl = process.env.RECEIPT_SERVICE_URL;

    if (!receiptServiceUrl) {
      return errorResponse(
        "Receipt processing service is not configured.",
        500
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("Sign in is required.", 401);
    }

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.access_token) {
      return errorResponse(
        "Your session has expired. Sign in again and retry the upload.",
        401
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return errorResponse("Receipt file is required.", 400);
    }

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      return errorResponse(
        "Only JPG, PNG, and PDF files are supported.",
        415
      );
    }

    if (file.size === 0) {
      return errorResponse("The selected file is empty.", 400);
    }

    if (file.size > MAX_FILE_SIZE) {
      return errorResponse(
        "The file must be 10 MB or smaller.",
        413
      );
    }

    const serviceFormData = new FormData();
    serviceFormData.append("file", file, file.name);

    const serviceEndpoint = new URL(
      "/v1/receipts",
      receiptServiceUrl
    );

    const serviceResponse = await fetch(serviceEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
      body: serviceFormData,
    });

    const responseBody = await serviceResponse
      .json()
      .catch(() => null);

    if (!serviceResponse.ok) {
      const error = getFastApiError(
        responseBody,
        "Receipt processing failed."
      );

      return NextResponse.json(
        {
          ...(responseBody &&
          typeof responseBody === "object"
            ? responseBody
            : {}),
          error,
        },
        {
          status: serviceResponse.status,
        }
      );
    }

    return NextResponse.json(responseBody, {
      status: serviceResponse.status,
    });
  } catch (error) {
    console.error("POST /api/documents failed:", error);

    return errorResponse(
      error instanceof Error
        ? error.message
        : "Receipt upload failed.",
      502
    );
  }
}
