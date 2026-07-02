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
- Routes are thin; provider integrations are behind interfaces for reuse by other applications.

