# Receipt Processor

Independent FastAPI service for receipt upload, OCR orchestration, structured extraction, and receipt status lookup.

## Local Setup

```bash
cd services/receipt-processor
python -m venv .venv
.venv\Scripts\activate
pip install -e ".[dev]"
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

Use `OCR_PROVIDER=mock`, `REPOSITORY_BACKEND=memory`, and `STORAGE_BACKEND=memory` for local development without external services.

For production OCR, use `OCR_PROVIDER=google_vision` and configure Google
Application Default Credentials or `GOOGLE_APPLICATION_CREDENTIALS` for the
service account that can call Cloud Vision.

To use Alibaba Model Studio Qwen vision OCR for JPG/PNG receipts, set
`OCR_PROVIDER=qwen_vl`, `QWEN_API_KEY`, and optionally `QWEN_MODEL`
or `QWEN_BASE_URL`. The default model is `qwen-vl-max` through the
OpenAI-compatible DashScope endpoint.

When `QWEN_API_KEY` is set, ReceiptBrain also enables a Qwen line-item
refinement pass for receipts whose rule-based line items do not match the
extracted receipt total. It uses `QWEN_LINE_ITEM_MODEL=qwen-plus` by default
and accepts its result only when every item has a total and their sum matches
the receipt total within one penny. Set `QWEN_LINE_ITEM_REFINEMENT=false` to
turn this fallback off.

For Supabase-backed uploads, configure `.env` with `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service
verifies forwarded user access tokens through Supabase Auth `/auth/v1/user`;
do not store user JWTs in `.env`.

Receipt processing is asynchronous by default. Uploads return `202 Accepted`
after the original file, receipt record, and durable job are stored. The same
FastAPI service runs a worker loop that atomically claims jobs from Supabase,
performs OCR/parsing, and retries provider failures with backoff. Apply
`supabase/migrations/20260721190000_async_receipt_processing.sql` before
enabling Supabase processing. Configure `ASYNC_WORKER_ENABLED=true`,
`ASYNC_WORKER_POLL_SECONDS=1`, and optionally `ASYNC_WORKER_MAX_ATTEMPTS=3`.
Run one worker-enabled service replica unless the Supabase migration is applied;
the migration's claim function safely supports multiple replicas.

## API

Health:

```bash
curl http://localhost:8000/health
```

Upload:

```bash
curl -X POST http://localhost:8000/v1/receipts ^
  -H "Authorization: Bearer <supabase-jwt>" ^
  -F "file=@receipt.pdf"
```

Status:

```bash
curl http://localhost:8000/v1/receipts/<receipt-id> ^
  -H "Authorization: Bearer <supabase-jwt>"
```

## Tests And Checks

```bash
pytest
ruff check .
mypy app tests
```

## Notes

- The Supabase service-role key belongs only in this service environment.
- Do not send service-role keys to the browser or Next.js client components.
- `SUPABASE_PUBLISHABLE_KEY` is used only to verify the user's forwarded
  access token with Supabase Auth.
- Routes are thin; provider integrations are behind interfaces for reuse by other applications.
