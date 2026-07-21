# ReceiptBrain project context

## Project vision

ReceiptBrain turns receipt images and PDFs into reviewed spending records and
personal spending insight. Its product direction is a calm AI personal-finance
companion, not an accounting-style expense tracker.

## Target users

- Individuals who want useful context from receipts they already keep.
- Users who need to correct OCR before trusting a record.
- Qwen Cloud hackathon judges evaluating a working AI workflow.

## Product goals

**Short term:** trustworthy parsing and reconciliation, explainable Spending
Story/DNA/timeline experiences, and a judge-safe OpenAI Build Week demo.

**Long term:** insight history, premium achievements, cited conversational
finance, asynchronous processing, observability, and production hardening.

## Current features

- Supabase email/password authentication, session refresh, RLS, and private
  receipt storage.
- JPG/PNG/PDF upload through Next.js to FastAPI; receipt list/detail, file
  preview, reprocessing, editable receipt fields, and editable line items.
- Completion is automatic only when non-null item totals match the receipt total.
- Deterministic extraction for merchant/date/totals/VAT/category and selected
  Aldi, Tesco, B&M, and Indian-food item patterns.
- Mock, Google Vision, and Qwen VL OCR; optional Qwen JSON item refinement is
  only accepted when it reconciles to the receipt total.
- Persisted merchant normalization, structured insights, recurring patterns,
  Spending DNA, streak, and Smart Shopper profile data.
- Dashboard story, insights, DNA preview/timeline, shareable Spending Story,
  DNA history, day-of-week rhythm insight, and Qwen/fallback receipt chat.
- A public, explicit Demo Mode at `/dashboard?demo=1` with fictional,
  non-branded grocery, dining, travel, subscription, and coffee receipts.
  The demo scope continues through Story, DNA, receipt history/detail, AI chat,
  and cited chat so a judge never falls into unrelated mock data.
  Middleware permits these explicit `?demo=1` routes without sign-in while
  retaining authentication for every non-demo personal-data route.
- Vitest frontend tests; pytest, Ruff, and mypy backend checks.
- Receipt uploads now return promptly with a durable queued job. The FastAPI
  receipt-processor worker claims the Supabase-backed work, processes OCR/Qwen,
  persists results, and retries failures with backoff.

## Planned features

The next product priorities are public submission evidence, an insight archive,
and premium achievements. See `TODO.md`.

## Technology stack

| Area | Repository technology |
| --- | --- |
| Frontend | Next.js 15.5.20 App Router, React 19, TypeScript, Tailwind |
| UI | Radix, Lucide, CVA, Recharts |
| Backend | Python 3.12, FastAPI, Pydantic, HTTPX |
| Data | Supabase Postgres, Auth, private Storage, RLS |
| AI | Qwen VL/text via DashScope-compatible API, Google Vision, deterministic parsing |
| Testing | Vitest/Testing Library, pytest, Ruff, mypy |
| Deployment | No committed deployment configuration; FastAPI includes a Dockerfile |

## Design principles

Premium, calm, minimal, and personal. Use Apple Health-like summaries, Spotify
Wrapped-style reflection, Linear-like focus, and explainable AI. Show evidence,
confidence, citations, and review state; avoid spreadsheet density and jargon.

## Current architecture summary

Next.js owns UI, auth session use, and API proxies. FastAPI owns receipt file
processing, OCR, parsing, optional Qwen refinement, and service-role persistence.
Supabase provides Auth, Postgres, RLS, and the private receipt bucket.

The frontend dependency tree was security-patched on 2026-07-18: Next.js is
pinned to `15.5.20` and PostCSS to `8.5.19` through an npm override; the
production dependency audit reports zero vulnerabilities.

For Qwen's dedicated `qwen-vl-ocr` models, the FastAPI processor uses
DashScope's native `text_recognition` task so receipt parsing receives plain
text rather than layout coordinates.

The public home page describes ReceiptBrain and includes a Demo Mode entry.
Authenticated users are sent to `/dashboard`, where uploads, receipt history,
DNA, Story, AI chat, and profile settings are available.
Settings and sign-out are grouped in the top-right profile menu, keeping the
sidebar focused on spending workflows; the account control and menu use opaque
card surfaces for reliable contrast.
Receipt owners can delete a receipt from its document page; the processor removes
the database record and attempts to remove the private original file.
The repository is MIT-licensed for public hackathon submission.

## Documentation maintenance rule

At every future Codex session close, update this file, `TODO.md`, `HANDOFF.md`,
`DECISIONS.md`, and `SESSION_SUMMARY.md`. These files are project memory.
