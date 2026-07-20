# ReceiptBrain Architecture

ReceiptBrain is a Qwen-powered receipt reasoning app. It converts receipt
images into structured spending memory, lets users correct extraction mistakes,
and answers questions over receipt totals, line items, discounts, and trends.

## System Flow

1. The user uploads a receipt in the Next.js app.
2. The Next.js API validates the user session and forwards the file to the
   FastAPI receipt processor.
3. The receipt processor stores the original file in private Supabase Storage.
4. Qwen VL reads the image through the DashScope OpenAI-compatible API and
   returns line-by-line OCR text.
5. The extraction pipeline converts raw OCR into merchant, date, total,
   category, line items, quantities, unit prices, discounts, and review status.
6. Supabase stores receipt rows and item rows behind row-level security.
7. The review screen shows the original receipt, raw OCR, extracted fields, and
   editable line items.
8. The AI chat route sends recent receipts plus line items to Qwen text
   reasoning and falls back to deterministic local reasoning if Qwen is not
   configured or unavailable.

## Qwen Integration

ReceiptBrain uses Qwen in two places:

- `qwen_vl` OCR provider in `services/receipt-processor`: sends receipt images
  to Qwen VL and asks for plain line-by-line transcription.
- `/api/ai-chat` in the Next.js app: sends compact receipt history, line items,
  and discounts to Qwen text reasoning for natural-language answers.

Both integrations use server-side environment variables only. The browser never
receives the Qwen API key.

## Engineering Boundaries

- `app/api/documents`: browser-facing upload proxy.
- `services/receipt-processor`: independent FastAPI service for upload,
  storage, OCR, extraction, and reprocessing.
- `app/dspy_pipeline`: composable extraction modules for merchant, date,
  subtotal, tax, total, category, summary, and line items.
- `lib/qwen-reasoning.ts`: server-only Qwen receipt reasoning client.
- `components/dashboard/line-items-editor.tsx`: human review loop for correcting
  scan mistakes.

## Reliability And Review

Receipt OCR is noisy, especially for grocery receipts. ReceiptBrain handles this
with layered safeguards:

- OCR provider abstraction with mock, Google Vision, and Qwen VL providers.
- Timeout and retry handling around external OCR calls.
- Deterministic parser tests for ALDI, Tesco, and Sainsbury receipt layouts.
- Editable line items for user correction.
- Automatic recalculation of row totals when quantity or unit price changes.
- Receipt status changes to `review` when line-item totals do not match the
  receipt total.

## Product Value

The product solves a practical problem: people collect receipts but rarely turn
them into usable spending memory. ReceiptBrain makes receipt data searchable,
reviewable, and useful for financial questions such as:

- Which stores are getting more expensive?
- Which category is driving spend this month?
- Which purchases were discounted?
- Which receipts need review because item totals do not match the receipt total?

This architecture can scale into consumer receipt memory, small-business expense
review, family spending, or open-source receipt parsing benchmarks.
