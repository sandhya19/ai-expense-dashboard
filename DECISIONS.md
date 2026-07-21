# Engineering decisions

## Deterministic parser before Qwen refinement

- **Decision:** Run deterministic extraction first; ask Qwen for line items only
  when items do not reconcile; accept only an exact reconciled result.
- **Reason:** Finance data needs a hard trust boundary rather than silent guesses.
- **Alternatives considered:** Always-model extraction; manual review only.
- **Date:** 2026-07-17.
- **Impact:** Better recovery for difficult receipts with numerical guardrails.
- **Future considerations:** Add fixture metrics and per-item provenance.

## Completion requires reconciliation

- **Decision:** A receipt cannot be manually completed unless all line items have
  totals and sum to the receipt total within £0.01.
- **Reason:** Prevent inaccurate records from entering dashboard intelligence.
- **Alternatives considered:** Manual override; confidence-only completion.
- **Date:** 2026-07-17.
- **Impact:** More review for poor OCR but stronger downstream insight quality.
- **Future considerations:** Add mismatch breakdown and exception workflow.

## Supabase is the data/auth/storage boundary

- **Decision:** Use Supabase Auth, RLS, and private Storage. FastAPI alone uses
  a service-role key for trusted persistence.
- **Reason:** Browser data access must be owner-scoped while processing persists
  system-derived results.
- **Alternatives considered:** Browser-only processing; custom auth.
- **Date:** Existing architecture; documented 2026-07-17.
- **Impact:** Clear separation with a service-role secret-management obligation.
- **Future considerations:** Add live RLS tests and secret rotation.

## Qwen chat has deterministic fallback

- **Decision:** Use bounded receipt context for Qwen text reasoning and local
  calculation fallback when Qwen is missing or unavailable.
- **Reason:** Preserve a working product/demo without model availability.
- **Alternatives considered:** Qwen-only chat; no chat.
- **Date:** Existing architecture; documented 2026-07-17.
- **Impact:** Resilient UX with smaller but predictable fallback coverage.
- **Future considerations:** Structured tools, prompt telemetry, and API tests.

## Story-first premium UX

- **Decision:** Prioritise Spending Story, DNA, timeline, and guided insight over
  chart-first dashboards.
- **Reason:** Aligns the product with a personal companion vision.
- **Alternatives considered:** Traditional expense table/dashboard.
- **Date:** Existing Increment 1–3 direction; documented 2026-07-17.
- **Impact:** Strong demo narrative; some legacy chart/table components are unused.
- **Future considerations:** Remove or deliberately reuse legacy components.

## Documentation is project memory

- **Decision:** Keep root context, architecture, backlog, handoff, decisions,
  demo, improvements, status, and session summary documents current.
- **Reason:** Future Codex sessions need repository-grounded continuity.
- **Alternatives considered:** Conversation-only memory.
- **Date:** 2026-07-17.
- **Impact:** Adds required session close-out work.
- **Future considerations:** Link decisions to commits/PRs as work lands.

## Pin patched Next.js and PostCSS before public deployment

- **Decision:** Upgrade Next.js from `15.1.3` to `15.5.20`, pin direct PostCSS
  to `8.5.19`, and use an npm override so Next's nested PostCSS also resolves to
  the patched release.
- **Reason:** The audit reported critical Next.js and moderate PostCSS findings;
  the public ECS deployment must not use the vulnerable dependency tree.
- **Alternatives considered:** `npm audit fix --force`; server-only patching;
  leaving the audit unresolved for the hackathon demo.
- **Date:** 2026-07-18.
- **Impact:** Production audit now reports zero vulnerabilities; lockfile is the
  authoritative deployment input and servers must use `npm ci`.
- **Future considerations:** Re-run audit during each release and remove the
  override once Next publishes a release that no longer pins vulnerable PostCSS.

## Use Qwen OCR's explicit plain-text task for receipt transcription

- **Decision:** Route `qwen-vl-ocr` models through DashScope's native
  `text_recognition` task instead of relying on a general vision prompt.
- **Reason:** Coordinate-only localization output cannot be safely parsed into
  receipt data; the explicit OCR task has a plain-text response contract.
- **Alternatives considered:** Continue using the OpenAI-compatible prompt;
  parse coordinate-only results; return to Google Vision only.
- **Date:** 2026-07-18.
- **Impact:** Qwen OCR output is usable by the existing receipt parser and
  coordinate-only responses are rejected clearly.
- **Future considerations:** Add PDF-to-image rendering and evaluate Qwen's
  structured key-information task for direct receipt extraction.

## Separate the public product home from the personal finance workspace

- **Decision:** Keep `/` as a feature-led public home; redirect authenticated
  users to protected `/dashboard` and make profile settings explicit.
- **Reason:** Personal spending views and upload actions should not appear before
  sign-in, while visitors still need a compelling product story.
- **Alternatives considered:** One dashboard for everyone; a marketing page
  hosted separately; hide individual widgets only.
- **Date:** 2026-07-18.
- **Impact:** Clear public/private boundary and a discoverable profile path.
- **Future considerations:** Add account email change, notification preferences,
  and a mobile navigation treatment.

## Refine all Qwen OCR receipts with reconciliation guardrails

- **Decision:** Run the structured Qwen line-item refinement pass for Qwen OCR
  receipts even when heuristic totals reconcile; replace results only on exact
  reconciliation.
- **Reason:** OCR text can be spatially scattered while still producing a
  coincidentally matching total, leaving item descriptions or quantities wrong.
- **Alternatives considered:** Refine only on a mismatch; always trust OCR;
  accept non-reconciled model output.
- **Date:** 2026-07-18.
- **Impact:** Better item recovery without weakening total-validation rules.
- **Future considerations:** Track refinement acceptance and evaluate it against
  anonymised receipt fixtures.

## Put account actions in the top-right profile menu

- **Decision:** Remove personal settings and sign-out from the sidebar and show
  them in the profile menu beside the user identity.
- **Reason:** Account actions should remain easy to reach regardless of sidebar
  length and belong with the visible user context.
- **Alternatives considered:** Persistent sidebar footer; a settings nav item.
- **Date:** 2026-07-18.
- **Impact:** Simpler navigation and an obvious, compact sign-out location.
- **Future considerations:** Add keyboard escape/outside-click behaviour if the
  lightweight account menu grows.

## Use opaque account surfaces

- **Decision:** Render the profile trigger and account menu on solid card
  backgrounds with borders and elevation.
- **Reason:** The account affordance must remain visible over a translucent app
  header and clearly communicate interactivity.
- **Alternatives considered:** Transparent text-only trigger; no menu surface.
- **Date:** 2026-07-18.
- **Impact:** Better contrast and a more premium, dependable profile control.

## Delete receipts through the processor with an owner check

- **Decision:** The document delete action calls an authenticated processor
  endpoint, which verifies ownership before deleting the receipt and file.
- **Reason:** Browser-only deletion risks inconsistent RLS/storage behaviour and
  cannot safely use the trusted storage credential.
- **Alternatives considered:** Hide faulty receipts; browser-direct deletion.
- **Date:** 2026-07-18.
- **Impact:** Users can remove mistaken uploads without access to other users'
  data.

## Use the MIT License for the public hackathon repository

- **Decision:** Add an MIT License at the repository root.
- **Reason:** The Devpost rules require a public, open-source repository with a
  visible license; MIT is permissive and appropriate for this demo project.
- **Alternatives considered:** Apache-2.0; no public license.
- **Date:** 2026-07-20.
- **Impact:** Satisfies a mandatory submission artefact without restricting
  evaluation or reuse of the demo code.

## Make GPT-5.6 financial actions dashboard-visible with a transparent fallback

- **Decision:** Present the GPT-5.6 Financial Action on the dashboard and keep
  its strict schema/citation validation. When GPT-5.6 is unavailable or returns
  unverifiable evidence, return a deterministic local plan with the same cited
  receipt contract and label it as local reasoning.
- **Reason:** OpenAI Build Week requires visible, non-trivial GPT-5.6 use, but
  a judge demo must remain usable during configuration or provider failures.
- **Alternatives considered:** Fail the action entirely; present local output
  as model output; make the action an isolated secondary page.
- **Date:** 2026-07-21.
- **Impact:** GPT-5.6 is a core product moment while financial claims remain
  inspectable and the fallback never misrepresents its source.
- **Future considerations:** Demo Mode must use original, non-branded sample
  receipts and test the GPT-5.6 route under configured and unavailable states.

## Keep hackathon Demo Mode public, fictional, and query-scoped

- **Decision:** Expose Demo Mode through `/dashboard?demo=1` and pass that
  explicit scope through the dashboard, action-plan API, history, and receipt
  detail screens. Use only original fictional merchants and fixture data.
- **Reason:** Judges need a complete, reliable product journey without accounts,
  credentials, real financial data, or third-party receipt brands in the demo.
- **Alternatives considered:** Implicit mock mode based on missing environment
  variables; real data seeded into Supabase; branded receipt fixtures.
- **Date:** 2026-07-21.
- **Impact:** Demo behaviour is intentional and transparent rather than hiding
  a missing setup, while evidence links remain inspectable.

## Preserve Demo Mode context and only name the active AI source

- **Decision:** Propagate `demo=1` through every judge-facing route and label
  the Financial Action generically until a returned response can truthfully
  identify GPT-5.6; local results remain explicitly labelled.
- **Reason:** A public demo must not silently switch to unrelated fixtures or
  imply paid API runtime that is not configured.
- **Date:** 2026-07-21.
- **Impact:** The demonstration remains coherent and transparent while Qwen can
  still be used as the live OCR/chat provider when credentials are available.

## Remove Financial Action and prioritise durable receipt processing

- **Decision:** Remove the overlapping Financial Action surface and move
  durable asynchronous receipt processing to the top product-engineering
  priority.
- **Reason:** Memory, Story, DNA, and cited chat already explain habits and
  patterns. A plan that neither persists nor takes action added confusion,
  while synchronous OCR directly harms upload reliability and demo flow.
- **Date:** 2026-07-21.
- **Impact:** The product narrative is clearer; the next implementation must
  use persisted jobs and a worker/retry model rather than in-process tasks.

## Keep async receipt work inside the FastAPI receipt-processor

- **Decision:** The existing FastAPI service is both the receipt API and the
  durable worker. Uploads persist a Supabase job and return `202`; its managed
  worker loop atomically claims jobs, runs the existing OCR/Qwen pipeline, and
  persists results or retry state.
- **Reason:** OCR, Qwen credentials, private receipt storage, parsing, and
  service-role persistence already belong to this service. A separate AI
  service would add deployment complexity without strengthening the product.
- **Alternatives considered:** synchronous upload processing; FastAPI
  `BackgroundTasks`; a new queue provider/service.
- **Date:** 2026-07-21.
- **Impact:** Jobs survive request completion and can be recovered after a
  worker restart when their lease expires. The required Supabase migration
  includes an atomic `FOR UPDATE SKIP LOCKED` claim function.
