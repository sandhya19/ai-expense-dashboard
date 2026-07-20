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

## Planned Build Week extension

The new feature is **Weekly Financial Action Plan**. It will use GPT-5.6 to
turn a selected, user-owned receipt history into one practical weekly spending
action. The generated plan will include structured evidence references so the
interface can show which receipt data supports it.

The extension will preserve ReceiptBrain's trust boundary: the server will
send only scoped receipt context, validate the model response against a schema,
and reject evidence references that do not belong to the supplied context.

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

Baseline and scope declaration complete. The GPT-5.6 extension, validation,
tests, documentation, video, and submission evidence remain to be completed.
