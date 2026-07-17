# Qwen Cloud / Alibaba Cloud submission readiness

ReceiptBrain is technically aligned with a Qwen Cloud submission: it uses Qwen
Vision Language for receipt extraction and Qwen text reasoning for grounded
receipt questions. The Qwen credentials remain server-side, and deterministic
fallbacks keep the demo usable if a model request fails.

## Current competition status

ReceiptBrain is eligible for the active Qwen Cloud Global AI Hackathon, which
is distinct from Alibaba Cloud's earlier Agentic AI Competition. The submission
deadline was extended to **20 July 2026** (the Devpost listing gives the exact
cut-off as 2:00 PM PDT). Complete the final submission before that time.

Official event pages:

- <https://www.qwencloud.com/challenge/hackathon>
- <https://qwencloud-hackathon.devpost.com/updates/45184-more-time-to-build-submission-deadline-extended-to-july-20>

## Reusable submission checklist

- [x] Clear problem and demo narrative: turn receipts into trusted spending
  memories, then explain the habits behind them.
- [x] Qwen-backed receipt OCR and grounded Qwen finance chat are implemented.
- [x] User corrections, validation, and receipt citations make AI output
  reviewable rather than opaque.
- [ ] Deploy the Next.js app and FastAPI receipt service on Alibaba Cloud.
- [ ] Configure production `QWEN_API_KEY`, Supabase, storage, and OCR settings
  as secret environment variables in the deployment platform.
- [ ] Record a short demo covering upload, correction/validation, Spending
  Story, and a cited Qwen chat answer.
- [ ] Prepare an architecture diagram, public repository link, and concise
  explanation of Qwen's role before submitting.
- [ ] Verify the exact competition rules, deadline, eligibility, regions, and
  required Alibaba Cloud services on the official event page.

## Recommended demo arc

1. Upload a real receipt and show OCR extraction.
2. Correct a line item and show that completion is blocked until totals match.
3. Open the spending story and explain one evidence-backed insight.
4. Ask Qwen a receipt-specific question and show its cited answer.
5. Close with the privacy boundary: receipt data stays scoped to the signed-in
   user and Qwen receives only the minimum receipt context needed for the
   answer.
