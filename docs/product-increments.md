# ReceiptBrain product increments

This checklist tracks the premium personal-finance companion roadmap. A feature is marked complete only once it is implemented and validated locally; deployment-dependent work is kept separate.

## Increment 1 — Premium spending foundation

- [x] Replace the chart-first dashboard with a monthly spending story.
- [x] Add structured insight cards with impact, supporting data, recommendation, and confidence.
- [x] Add a Spending DNA profile with explainable, receipt-derived traits.
- [x] Add a responsive receipt intelligence timeline to the dashboard.
- [x] Refresh the upload completion experience with AI processing and “What I noticed” feedback.
- [x] Exclude restaurant tax, total, and payment summary rows from extracted line items.
- [x] Let users delete incorrect extracted line items during receipt review.
- [x] Add a conservative Indian-food vocabulary to correct common OCR spelling variants.
- [x] Parse B&M-style headers, promotions, and merchant aliases without shifting item prices.
- [x] Interpret quantity-at-price annotations and let users add missing receipt line items.
- [x] Add an insights API data contract (`GET /api/insights`).
- [x] Add an additive Supabase migration for categories, merchants, insights, spending patterns, and user profiles.
- [x] Validate the frontend production build and existing receipt-processor test suite.

### Required before Increment 1 is live

- [x] Apply `20260716110000_spending_intelligence.sql` to the target Supabase project.
- [x] Manually test the upload → scan → dashboard refresh flow against production services.
- [x] Add a frontend test runner and unit tests for spending intelligence, timeline states, and upload success feedback.

## Increment 2 — Persistent personal intelligence

- [x] Generate and persist insights after receipt processing completes.
- [x] Create/update merchant records from normalized receipt merchants.
- [x] Detect recurring subscriptions from merchant, amount, and cadence signals.
- [x] Persist Spending DNA, receipt streaks, and smart-shopper achievements in `user_profiles`.
- [x] Add merchant and category trend APIs with date-range support.
- [x] Show recurring-subscription opportunities in the spending story.
- [ ] Add integration tests for insight persistence and user-level RLS access.

## Increment 3 — Guided discovery and monthly stories

- [ ] Build a dedicated Spending DNA page with trait explanations and history.
- [ ] Build a shareable monthly “Spending Story” / Wrapped-style experience.
- [ ] Add day-of-week and spending-rhythm insights.
- [ ] Add lightweight premium achievements: streaks, savings moments, and smart-shopper badges.
- [ ] Add an insight archive with dismiss and feedback actions.

## Increment 4 — Conversational finance companion

- [ ] Add structured chat tools for category totals, date ranges, merchant analysis, and subscriptions.
- [ ] Add line-item-aware coffee and item-level spending analysis.
- [ ] Add clear calculation breakdowns and receipt citations to every answer.
- [ ] Add follow-up questions and suggested prompts based on the user’s data.
- [ ] Add chat API integration tests and AI-fallback tests.

## Increment 5 — Product hardening

- [ ] Move receipt processing to an asynchronous job flow with visible progress updates.
- [ ] Add observability for OCR, extraction, insight generation, and AI failures.
- [ ] Add performance checks for large receipt histories.
- [ ] Add accessibility review for keyboard navigation, motion, contrast, and screen-reader labels.
- [ ] Add mobile UX review and real-device testing.
