# Improvement recommendations

## High impact

| Recommendation | Implementation effort | Demo value | Evidence |
| --- | --- | --- | --- |
| Add live Supabase/RLS integration tests and a documented migration command. | M | High | Only unit/memory coverage is committed; schema sources overlap. |
| Move OCR/refinement to asynchronous jobs with visible progress. | L | High | Upload processing runs synchronously in FastAPI. |
| Build an anonymised OCR/parser evaluation suite with reconciliation/field metrics. | M | High | Retailer rules are fixture-specific and no aggregate quality metric exists. |
| Add observability for provider/model/persistence failures and latency. | M | High | Errors log but have no metric/trace pipeline. |

## Medium impact

| Recommendation | Implementation effort | Demo value | Evidence |
| --- | --- | --- | --- |
| Load persisted profile/insight records in the frontend instead of recomputing all DNA locally. | M | Medium | `user_profiles` persists data but dashboard derives DNA from receipts. |
| Add insight archive dismiss/feedback actions. | M | High | Schema supports `insights.status`; no current UI/action uses it. |
| Add chat API/fallback tests and structured date/category/item tools. | M | High | Chat has useful logic but no committed tests. |
| Add receipt parsing provenance/refiner flag to UI and DB. | M | Medium | Users cannot see whether Qwen refinement supplied items. |

## Low impact

| Recommendation | Implementation effort | Demo value | Evidence |
| --- | --- | --- | --- |
| Remove or reuse `charts.tsx`, `recent-documents.tsx`, and `personal-finance-coach.tsx`. | S | Low | They are not imported by current routes. |
| Consolidate duplicate/overlapping root SQL schemas and migrations. | M | Medium | `schema.sql`, `documents_schema.sql`, service migration, and dated migrations overlap. |
| Replace compressed one-line React components with formatted code. | S | Low | Several components are hard to review and maintain. |
| Add performance limits/pagination to receipt and chat history queries. | M | Medium | Receipt list loads all rows; chat slices after retrieval. |

## Security notes

- Private file route authorises a user but relies on Supabase RLS for receipt-row
  ownership; retain and test this dependency.
- Keep Qwen and Supabase service-role keys out of frontend environment variables.
- Apply database migrations consistently before relying on RLS/schema behavior.
