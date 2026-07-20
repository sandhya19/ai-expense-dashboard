# ReceiptBrain hackathon demo guide

## 30-second pitch

ReceiptBrain turns the receipts people already have into an AI personal-finance
companion. Qwen reads receipt data, ReceiptBrain checks the mathematics, and the
product turns the result into explainable stories, habits, and cited answers.

## 3-minute demo

1. Explain that bank feeds lack the item/discount context contained in receipts.
2. Upload a receipt; show extraction and that it remains in review if totals do
   not reconcile. Correct an item where needed.
3. Show the Spending Story, rhythm insight, and Spending DNA.
4. Ask “What subscriptions do I have?” or “How much did I spend on coffee?” and
   show the answer’s receipt citations and Qwen/fallback label.
5. Share a monthly story; note it excludes receipt images, merchants, and lines.

## 5-minute extension

- Reprocess a difficult receipt and explain strict Qwen item refinement.
- Show DNA history and editable receipt review.
- Explain private storage and Supabase RLS.

## AI and innovation highlights

- Qwen VL OCR through a DashScope-compatible endpoint.
- Deterministic parsing followed by Qwen JSON refinement only on mismatch.
- JSON/schema validation and £0.01 reconciliation reject unsafe model output.
- Qwen receipt chat is bounded to supplied receipt data and has deterministic
  fallback plus citations.
- Story/DNA experiences turn transactional data into a personal companion.

## Alibaba/Qwen services

- Qwen Cloud / Alibaba Model Studio-compatible Qwen VL and text endpoints.
- Alibaba Cloud deployment is planned but no IaC/deployment configuration is
  committed yet.

## Judge questions

| Question | Answer |
| --- | --- |
| How do you prevent AI hallucinations? | A model result must validate and reconcile exactly; otherwise it is rejected and the receipt stays in review. |
| Why receipts? | They include item, discount, and tax context absent from bank transactions. |
| What if Qwen fails? | Deterministic/provider fallbacks keep the app usable; chat labels its source. |
| How is data protected? | Supabase Auth/RLS scope user data, files are private, and provider/service keys are server-only. |
| What is the value? | It makes tracking rewarding by turning receipts into grounded personal guidance. |
