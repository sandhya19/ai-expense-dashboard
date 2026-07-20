# ReceiptBrain backlog

## High priority

| Task | Description | Impact | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Alibaba Cloud deployment | Deploy Next.js/FastAPI, configure HTTPS, secrets, service URL, and health checks. | Critical hackathon need | M | Cloud account, Qwen/Supabase credentials |
| Supabase integration/RLS tests | Verify insight persistence and cross-user access in an isolated project. | Security/trust | M | Test Supabase project |
| Parsing evaluation set | Add anonymised real-receipt fixtures and reconciliation/accuracy metrics. | Product quality | M | Consent-safe fixtures |
| Insight archive | List, dismiss, and collect feedback on persisted insights. | Increment 3 completion | M | `insights.status`, UI/API |

## Recently completed

| Task | Description | Impact | Verification |
| --- | --- | --- | --- |
| Frontend dependency security patch | Updated Next.js to `15.5.20` and enforced PostCSS `8.5.19`. | Removes deployment-blocking critical audit findings | Typecheck, tests, production build, and production audit passed with 0 vulnerabilities on 2026-07-18. |
| Qwen OCR plain-text integration | Routes dedicated Qwen OCR models to DashScope `text_recognition` and rejects coordinate-only output. | Restores usable receipt extraction on ECS | 8 focused provider tests and Ruff passed on 2026-07-18. |
| Public home and personal workspace | Added public feature-led home, protected personal dashboard, profile settings, and Qwen-first item refinement. | Prevents personal UI exposure before sign-in and improves scattered OCR recovery | Frontend typecheck; 24 focused backend tests; Ruff passed on 2026-07-18. |
| Account-menu and Aldi quantity correction | Moved account actions into the top-right profile menu and fixed `2 x unit price` rows before Aldi products. | Improves navigation and prevents duplicate/misquantified items | Typecheck, 24 parser/refinement tests, and Ruff passed on 2026-07-18. |
| Opaque account control | Styled the profile button and account menu as opaque card surfaces. | Improves account-action visibility | Typecheck passed on 2026-07-18. |
| Receipt deletion | Added owner-authorised deletion of a receipt, its dependent data, and stored original file. | Lets users remove faulty uploads | Typecheck, 15 processor API tests, and Ruff passed on 2026-07-18. |

## Medium priority

| Task | Description | Impact | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Achievements UI | Surface persisted streak/Smart Shopper; define a data-backed saving-moment rule. | Engagement | S-M | `user_profiles`, receipt signals |
| Async processing | Replace synchronous OCR/model request with durable job/progress flow. | Reliability/UX | L | Queue choice |
| Observability | Trace OCR, parser, Qwen, persistence, latency, and failure paths. | Reliability/demo | M | Monitoring target |
| Chat tools/tests | Add date range/category/item calculations and API/fallback tests. | AI usefulness | M | Tool contract |
| Settings | Implement or remove the current settings placeholder. | Completeness | M | Product decision |

## Low priority

| Task | Description | Impact | Effort | Dependencies |
| --- | --- | --- | --- | --- |
| Email forwarding | Ingest email receipts. | Convenience | L | Email provider/security |
| Price history/forecasts | Track repeat item price and predict spend. | Differentiation | L | Item normalization |
| Budgets/reports/family | Add budgets, PDF reports, and shared households. | Growth | L | Schema/product design |
| Native apps | Build mobile clients. | Reach | XL | Stable API |

Update status, effort, and dependencies at every session close. Do not mark an
item complete without a local verification result.
