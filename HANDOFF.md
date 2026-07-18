# Engineering handoff

## Completed work

- Increment 1 and Increment 2 implementation items are complete except live
  Supabase insight/RLS integration tests.
- Increment 3 includes Spending DNA history, a private shareable Spending Story,
  and spending-rhythm insights. Achievements UI and insight archive remain.
- Qwen OCR, Qwen chat, and Qwen item-reconciliation fallback are implemented.

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

## Known issues and technical debt

- `charts.tsx`, `recent-documents.tsx`, and `personal-finance-coach.tsx` are
  currently not imported by routes.
- Root schemas overlap timestamped migrations; no verified migration command or
  CI database test is committed.
- Processing is synchronous; OCR/model requests hold the upload request.
- Qwen VL provider supports JPG/PNG, not PDF; use another OCR provider for PDF.
- Mock data activates without Supabase environment variables and can hide setup
  problems during manual testing.

## Recommended next milestone

Finish Increment 3 with an insight archive and achievement UI, then deploy to
Alibaba Cloud and add live Supabase/RLS integration tests.

## Risks

- Reconciled model output is numerically trustworthy, but descriptions can still
  be incorrect and require review.
- FastAPI service-role credentials are powerful and must stay server-only.
- Verify the active Qwen hackathon rules and deadline before submitting.

## Testing status

- Frontend: 6 Vitest tests, TypeScript check, and a production build passed on
  Next.js `15.5.20`; production `npm audit --omit=dev` reports 0 vulnerabilities.
- Backend: 46 pytest tests, Ruff, and mypy passed before this documentation pass.
- Build warnings remain for a raw `<img>` receipt preview and Supabase's
  Node-oriented dependency in middleware's Edge Runtime bundle; neither blocks
  the production build.

Before handoff, update `PROJECT_CONTEXT.md`, `TODO.md`, `HANDOFF.md`,
`DECISIONS.md`, and `SESSION_SUMMARY.md`.
