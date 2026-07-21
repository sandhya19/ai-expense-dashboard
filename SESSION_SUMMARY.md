# Session summary

## Date

2026-07-18

## Today’s work

- Completed OpenAI Build Week Milestone 1: surfaced the GPT-5.6 Financial
  Action on the dashboard, retained JSON-schema and receipt-citation checks,
  and added a transparent deterministic fallback for model/configuration
  failures.
- Added a focused fallback-plan test; TypeScript, 9 Vitest tests, and the
  production build passed. The build continues to warn about the receipt
  preview's raw `<img>`.
- Completed OpenAI Build Week Milestone 2: added public Demo Mode at
  `/dashboard?demo=1` with original fictional receipts and insight/action-plan
  evidence. Demo data has regression coverage for required categories and
  receipt citations.
- Completed judge-flow continuity pass: Demo Mode now propagates through Story,
  DNA, AI Chat, receipt history/detail, and Financial Action evidence. Renamed
  the visible action to generic AI wording until its actual source is known.
  TypeScript, 11 Vitest tests, and production build passed.
- Fixed the Demo Mode sign-in redirect by allowing only the explicit demo query
  routes through middleware without a user session. TypeScript and 11 Vitest
  tests passed after the change.
- Removed the overlapping Financial Action feature from the UI, routes, API,
  helpers, and tests. ReceiptBrain now focuses its intelligence narrative on
  verified receipts, Memory, Story, DNA, and cited Qwen/local chat. TypeScript,
  7 Vitest tests, and production build passed after removal.

- Completed and validated Increment 3 work in the active worktree: Spending DNA
  history page, private shareable Spending Story, and spending-rhythm insight.
- Created the root project-memory documentation requested for future sessions.
- Security-patched deployment dependencies: Next.js `15.5.20`, PostCSS `8.5.19`
  override, and refreshed lockfile.
- Updated Qwen receipt OCR integration to request Qwen OCR's explicit
  plain-text recognition task and reject coordinate-only layout output.
- Added a public feature-led home, protected `/dashboard` personal workspace,
  editable profile settings, and Qwen-first reconciled item refinement.
- Moved settings/sign-out into the top-right account menu and added an Aldi
  regression fixture for `2 x 2.99` followed by a product name and `5.98`.
- Made the top-right account control and its menu opaque, bordered card
  surfaces rather than transparent header content.
- Added owner-authorised receipt deletion from the document page, including
  removal of dependent receipt data and the private original file.
- Added a root MIT `LICENSE` to satisfy the Devpost public-repository rule.
- Verified TypeScript, 6 frontend tests, production build, and production npm
  audit (0 vulnerabilities).
- No new product feature was implemented after the documentation request.

## Files created

- `PROJECT_CONTEXT.md`
- `ARCHITECTURE.md`
- `TODO.md`
- `HANDOFF.md`
- `DEMO.md`
- `DECISIONS.md`
- `IMPROVEMENTS.md`
- `PROJECT_STATUS.md`
- `SESSION_SUMMARY.md`

## Files modified before documentation request

Increment 3 work currently modifies/creates Spending DNA and Spending Story
routes/components, dashboard/intelligence/types/history modules, tests, sidebar,
and increment/hackathon documentation. Refer to `git status --short` and
`HANDOFF.md` for the exact list.

## Current milestone

OpenAI Build Week Milestone 3 — Submission evidence. The GPT-5.6 extension and
Demo Mode are implemented; deployment/test access, submission provenance, and
the public narrated video remain.

## Next milestone

Prepare public deployment/test access, README provenance, Codex Session ID, and
the under-three-minute video. Then run final accessibility and live reliability
checks.

## Suggested first prompt for next Codex session

> Read PROJECT_CONTEXT.md, ARCHITECTURE.md, TODO.md, HANDOFF.md, DECISIONS.md,
> PROJECT_STATUS.md, and SESSION_SUMMARY.md. Inspect `git status`. Continue
> Increment 3 with the insight archive, update project-memory documents at the
> end, and do not commit or push unless I ask.

## Maintenance rule

At every future session close, update `PROJECT_CONTEXT.md`, `TODO.md`,
`HANDOFF.md`, `DECISIONS.md`, and this file.

## Priority update — 2026-07-21

Financial Action was removed after product review: it duplicated the value of
Memory, Story, DNA, and cited chat without persisting a user decision or taking
an action. Durable asynchronous receipt processing is now the active milestone.
Implement persisted jobs, worker claiming, retry/backoff, and visible progress
before returning to submission-polish work.

## Async processing completed — 2026-07-21

Implemented durable asynchronous receipt processing in the existing FastAPI
receipt-processor. Upload now returns `202 Accepted` after saving a receipt and
Supabase job; the service worker claims work atomically, downloads the stored
file, invokes the existing OCR/Qwen pipeline, and retries failures with
backoff. The upload dialog explains the queued state and refreshes the timeline
briefly while work completes. Backend verification: 53 pytest tests, Ruff, and
mypy passed; frontend TypeScript passed. Apply
`20260721190000_async_receipt_processing.sql` before deployment.
