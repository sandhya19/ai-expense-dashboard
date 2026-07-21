# OpenAI Build Week extension record

This document separates ReceiptBrain's pre-existing functionality from the
work added for the OpenAI Build Week submission.

## Submission category

**Apps for Your Life** — ReceiptBrain is a consumer personal-finance product
that turns private receipt history into understandable spending guidance.

## Baseline

The pre-extension baseline is commit
[`9d06961`](https://github.com/sandhya19/ai-expense-dashboard/commit/9d06961)
on 20 July 2026. It contains the Qwen Cloud hackathon implementation,
including Qwen Vision OCR, Qwen receipt chat, receipt reconciliation, spending
stories, Spending DNA, Supabase-backed private receipt storage, and Alibaba
Cloud ECS deployment configuration.

The following are pre-existing and must not be represented as newly built for
OpenAI Build Week:

- Qwen Cloud OCR and grounded receipt chat.
- The existing receipt upload, correction, reconciliation, Story, DNA, and
  insight experiences.
- Next.js, FastAPI, Supabase, and Alibaba Cloud ECS infrastructure.

## Build Week extension

The new Build Week extension is a **judge-safe Demo Mode** and durable
asynchronous processing. Demo Mode provides a
complete ReceiptBrain journey using original fictional receipt data rather than
personal or third-party branded material, and preserves the product's cited
Qwen/local chat and explainable Story/DNA experiences. The processing extension
stores a receipt job in Supabase, returns upload success promptly, and lets the
existing FastAPI receipt-processor claim, retry, and persist OCR work.

## Evidence to collect before submission

- Dated commits on `feat/openai-build-week` that implement and test the new
  feature.
- This document and the README's Build Week section, describing the boundary
  between prior work and the new extension.
- The `/feedback` Codex Session ID from the thread in which most of the
  extension was built.
- A public, under-three-minute video demonstrating the new feature and
  explaining how Codex and GPT-5.6 were used.
- A public testable deployment or judge test account, plus setup and sample
  data instructions.

## Status

Demo Mode is available at `/dashboard?demo=1`. It contains original fictional
receipts across grocery, dining, travel, subscriptions, and coffee; those
fixtures power the Story, AI Chat, receipt history, and receipt details.

The README now includes local setup, Demo Mode, migration, test, source, and
Codex-collaboration evidence. Remaining: deploy a public test instance (or
provide a test account), record the `/feedback` Session ID, and upload the
public narrated video under three minutes.
