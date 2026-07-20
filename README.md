# ReceiptBrain

ReceiptBrain is a responsive AI receipt memory app that turns everyday receipts
into a simple spending dashboard and basic financial insights.

## Problem

People collect receipts every month but rarely use them after purchase. Most
receipt apps stop at OCR and expense tracking, leaving users without clear
insight into their spending habits.

## Features

- [x] Upload a receipt by taking a photo or uploading an image.
- [x] Extract merchant, date, currency, total amount, and taxes when available.
- [x] Persist and display extracted line items when available.
- [x] Automatically assign each receipt to one spending category, such as
  groceries, dining, shopping, travel, or bills.
- [x] Store receipts in a searchable history with date, merchant, category, and
  amount fields.
- [x] Let users review and correct extracted data.
- [x] Show a simple dashboard with current-month spending, category breakdown,
  recent receipts, and a basic trend chart.
- [x] Generate short, plain-language insights from receipt history, including
  month-over-month changes and top spending categories.
- [x] Surface intelligent insight cards for duplicate purchases, subscription
  detection, monthly comparison, and overspending alerts.
- [x] Ask Qwen-powered natural-language questions over receipt history, line
  items, discounts, and spending patterns, with deterministic fallback logic
  when Qwen is not configured.

## Future Enhancements

- [ ] Email receipt forwarding.
- [ ] Subscription detection and recurring expense alerts.
- [ ] Price history for repeated purchases.
- [ ] Budget setup and budget alerts.
- [ ] Monthly PDF reports.
- [ ] Spending forecasts.
- [ ] More advanced coaching and savings recommendations.
- [ ] Native mobile apps.
- [ ] Shared household and family accounts.

## AI Models

ReceiptBrain uses Qwen Cloud in two places:

- Qwen VL extracts raw receipt text from uploaded receipt images through the
  OpenAI-compatible DashScope endpoint.
- Qwen text reasoning answers questions over recent receipts, line items,
  discounts, categories, and merchant trends through the server-side
  `/api/ai-chat` route.

If Qwen reasoning is not configured, the app falls back to deterministic local
receipt logic so local development and demos continue to work.

## Monetization

Launch with a free plan that supports up to 30 receipts per month and includes
the MVP features.

Future paid plans can add:

- Pro: unlimited receipts and future premium features.
- Family: shared household access and combined reporting.

## Vision

ReceiptBrain is a receipt memory app that helps people understand their spending
using the receipts they already collect.

## Run Locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

Receipt uploads are proxied through the Next.js API to the FastAPI receipt
processor. Set `RECEIPT_SERVICE_URL` in `.env.local`, for example
`http://127.0.0.1:8001`, and run `services/receipt-processor` locally before
testing uploads.

For Qwen-powered chat, set server-only Qwen variables in `.env.local`:

```bash
QWEN_API_KEY=...
QWEN_BASE_URL=https://dashscope-intl.aliyuncs.com/compatible-mode/v1
QWEN_REASONING_MODEL=qwen-plus
```

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and publishable key.
5. Configure the receipt processor service with Supabase and Qwen Cloud
   credentials.

Without Supabase environment variables, the dashboard uses demo data.

## Production Checks

```bash
npm run typecheck
npm test
npm run build
```

For Qwen Cloud / Alibaba Cloud submission preparation, use the checklist in
[`docs/qwen-cloud-hackathon.md`](docs/qwen-cloud-hackathon.md).

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for the Qwen OCR flow, Qwen receipt reasoning flow,
service boundaries, review loop, and scalability notes.

## Alibaba Cloud ECS deployment

ReceiptBrain includes a two-service container setup for Alibaba Cloud ECS.
Copy the two files in `deploy/` ending with `.env.example` to the equivalent
`.env` files on the server, fill server-only secrets, then run:

```bash
docker compose -f deploy/docker-compose.ecs.yml up -d --build
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:8001/health
```

Terminate HTTPS with Nginx and proxy traffic to `127.0.0.1:3000`; do not expose
the processor port publicly. See [`docs/JUDGE_REVIEW.md`](docs/JUDGE_REVIEW.md)
for the pre-submission smoke test and evidence checklist.
