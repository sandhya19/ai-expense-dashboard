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

## OpenAI Build Week: judge setup and Codex collaboration

ReceiptBrain fits the **Apps for Your Life** category. The project existed
before Build Week as a Qwen-powered receipt intelligence product. The Build
Week extension adds a public, judge-safe Demo Mode and durable asynchronous
receipt processing; see [`docs/openai-build-week.md`](docs/openai-build-week.md)
for the dated boundary between existing work and the extension.

Codex was used throughout the project to explore the product flow, implement
the full-stack changes, review trade-offs, write and update tests, and refine
the submission experience. The Build Week work used the Codex/GPT-5.6 workflow
to deliver the Demo Mode and persisted FastAPI job worker. Qwen remains the
runtime provider for receipt OCR and grounded receipt chat; ReceiptBrain does
not present Qwen output as OpenAI model output.

### Judge demo

- Public demo: `http://localhost:3000/dashboard?demo=1` after local startup,
  or the deployed equivalent.
- Demo Mode contains fictional, non-branded grocery, dining, travel,
  subscription, and coffee receipts. It needs no account, upload, or API key.
- Follow the public demo through Spending Story, Spending DNA, receipt history,
  receipt detail, and cited AI Chat.

### Live upload setup

Run the web app and processor in separate terminals:

```bash
# Terminal 1, repository root
npm install
npm run dev

# Terminal 2
cd services/receipt-processor
python -m uvicorn app.main:app --reload --port 8001
```

Set `RECEIPT_SERVICE_URL=http://127.0.0.1:8001` in `.env.local`. For a real
Supabase/Qwen upload, configure the server-only variables described below and
apply `supabase/migrations/20260721190000_async_receipt_processing.sql` before
starting the processor. Upload returns promptly with a queued state; the
FastAPI worker performs OCR/parsing and the UI refreshes as the result arrives.

### Submission evidence

- Source: <https://github.com/sandhya19/ai-expense-dashboard> (public, MIT).
- Tests: `npm run typecheck`, `npm test`, and, in `services/receipt-processor`,
  `python -m pytest`, `python -m ruff check .`, and `python -m mypy app tests`.
- Record the Codex `/feedback` Session ID from the main Build Week project
  thread in the Devpost submission.

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
3. Run `supabase/migrations/20260721190000_async_receipt_processing.sql` in
   the SQL editor for durable asynchronous receipt processing.
4. Copy `.env.example` to `.env.local`.
5. Add the project URL and publishable key.
6. Configure the receipt processor service with Supabase and Qwen Cloud
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
