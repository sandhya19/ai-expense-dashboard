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

For Supabase-backed uploads, configure `.env` with `SUPABASE_URL`,
`SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`. The service
verifies forwarded user access tokens through Supabase Auth `/auth/v1/user`;
do not store user JWTs in `.env`.

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
