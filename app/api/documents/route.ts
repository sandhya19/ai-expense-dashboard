import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const ALLOWED_FILE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

export async function POST(request: Request) {
  let uploadedPath: string | null = null;

  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          error: "Sign in is required.",
        },
        {
          status: 401,
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Receipt file is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!ALLOWED_FILE_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          error: "Only JPG, PNG, WEBP, and PDF files are supported.",
        },
        {
          status: 415,
        }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        {
          error: "The selected file is empty.",
        },
        {
          status: 400,
        }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: "The file must be 10 MB or smaller.",
        },
        {
          status: 413,
        }
      );
    }

    const safeFileName = file.name
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-");

    uploadedPath = `${user.id}/${crypto.randomUUID()}-${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("receipts")
      .upload(uploadedPath, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Supabase Storage upload failed:", uploadError);

      return NextResponse.json(
        {
          error: uploadError.message,
        },
        {
          status: 400,
        }
      );
    }

    const { data: receipt, error: insertError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        merchant: "Processing receipt",
        receipt_date: new Date().toISOString().slice(0, 10),
        category: "Uncategorised",
        total: 0,
        currency: "GBP",
        confidence: 0,
        status: "processing",
        is_business: false,
        storage_path: uploadedPath,
      })
      .select(
        `
          id,
          merchant,
          receipt_date,
          category,
          total,
          currency,
          confidence,
          status,
          is_business,
          storage_path,
          created_at
        `
      )
      .single();

    if (insertError) {
      console.error("Receipt database insert failed:", insertError);

      await supabase.storage
        .from("receipts")
        .remove([uploadedPath]);

      uploadedPath = null;

      return NextResponse.json(
        {
          error: insertError.message,
        },
        {
          status: 400,
        }
      );
    }

    return NextResponse.json(
      {
        receipt,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/documents failed:", error);

    if (uploadedPath) {
      try {
        const supabase = await createClient();

        await supabase.storage
          .from("receipts")
          .remove([uploadedPath]);
      } catch (cleanupError) {
        console.error("Storage cleanup failed:", cleanupError);
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Receipt upload failed.",
      },
      {
        status: 500,
      }
    );
  }
}