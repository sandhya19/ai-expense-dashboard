# Engineering handoff

## Completed work

- Increment 1 and Increment 2 implementation items are complete except live
  Supabase insight/RLS integration tests.
- Increment 3 includes Spending DNA history, a private shareable Spending Story,
  and spending-rhythm insights. Achievements UI and insight archive remain.
- Qwen OCR, Qwen chat, and Qwen item-reconciliation fallback are implemented.
- Demo Mode is available at `/dashboard?demo=1` from the public landing page.
  It uses only original fictional merchants and enables Story, receipt history,
  receipt details, and cited chat without a user
  account or external setup.
- Demo scope now remains intact when judges open Spending Story, Spending DNA,
  AI Chat, or receipt history/details.
- Middleware explicitly allows the Demo Mode route set without authentication;
  this fixes the prior redirect to sign-in for `/dashboard?demo=1`.

## Current branch status

- Branch: `feat-autonomous-expense-auditor`.
- Last pushed commit before current worktree: `29fd380`.
- Current uncommitted work: Spending DNA/Story routes/components/history,
  rhythm insight, documentation, and the Next.js/PostCSS security update.
- `docs/linkedin-ai-expense-dashboard-10-day-series.md` is intentionally ignored
  and must not be pushed.

## Current modified areas

- `app/spending-dna/`, `app/spending-story/`
- DNA/Story dashboard components and sidebar
- dashboard/intelligence/types/history libraries and frontend tests
- increment, hackathon, and root project-memory documents
- `package.json` and `package-lock.json` for Next.js `15.5.20` and PostCSS
  `8.5.19` override
- `services/receipt-processor/app/providers/ocr.py` and its focused tests for
  Qwen OCR plain-text recognition
- public landing, authenticated dashboard/profile route split, and Qwen-first
  line-item refinement changes are currently uncommitted

## Known issues and technical debt

- `charts.tsx`, `recent-documents.tsx`, and `personal-finance-coach.tsx` are
  currently not imported by routes.
- Root schemas overlap timestamped migrations; no verified migration command or
  CI database test is committed.
- Async processing requires `20260721190000_async_receipt_processing.sql` to
  be applied before deploying the worker-enabled FastAPI service.
- Qwen VL provider supports JPG/PNG, not PDF; use another OCR provider for PDF.
- Deploy the uncommitted Qwen OCR task change before using `qwen-vl-ocr` on ECS;
  it is locally verified but has not yet been committed or pushed.
- Qwen refinement can still decline a candidate that does not reconcile to the
  receipt total; this is intentional and preserves the financial trust boundary.
- Mock data activates without Supabase environment variables and can hide setup
  problems during manual testing.

## Recommended next milestone

Apply the async-job migration and run one live receipt upload with Qwen. Then
prepare the public OpenAI Build Week submission artefacts: deployment/test
access, README/Codex provenance, `/feedback` Session ID, and narrated video.

## Risks

- Reconciled model output is numerically trustworthy, but descriptions can still
  be incorrect and require review.
- FastAPI service-role credentials are powerful and must stay server-only.
- Verify the active Qwen hackathon rules and deadline before submitting.

## Testing status

- Frontend: 6 Vitest tests, TypeScript check, and a production build passed on
  Next.js `15.5.20`; production `npm audit --omit=dev` reports 0 vulnerabilities.
- Backend: 46 pytest tests, Ruff, and mypy passed before this documentation pass.
- Backend Qwen provider: 8 focused pytest tests and Ruff passed after the
  Qwen OCR plain-text task update.
- Public/private route split: TypeScript check passed; 24 focused backend tests
  and Ruff passed after Qwen-first refinement was added.
- Account-menu and Aldi parser correction: TypeScript check, 24 parser and
  refinement tests, and Ruff passed.
- Account-menu surface: TypeScript check passed after switching the profile
  button and popover to opaque card surfaces.
- Receipt deletion: TypeScript check, 15 processor API tests, and Ruff passed.
- Root MIT `LICENSE` was added on 2026-07-20 for Devpost submission eligibility.
- Financial Action removal: TypeScript check, 7 Vitest tests, and a production
  build passed on 2026-07-21. The build retains the known raw `<img>` warning
  for receipt preview.
- Durable async processing: 53 backend pytest tests, Ruff, mypy, and frontend
  TypeScript check passed on 2026-07-21. A Supabase migration remains a required
  deployment step.
- Judge-flow continuity pass: TypeScript, 11 Vitest tests, and a production
  build passed on 2026-07-21. The raw `<img>` warning remains.
- Build warnings remain for a raw `<img>` receipt preview and Supabase's
  Node-oriented dependency in middleware's Edge Runtime bundle; neither blocks
  the production build.

Before handoff, update `PROJECT_CONTEXT.md`, `TODO.md`, `HANDOFF.md`,
`DECISIONS.md`, and `SESSION_SUMMARY.md`.
