# Judge review: path to a winning ReceiptBrain submission

This review applies the official Qwen Cloud rubric: Innovation & AI (30%),
Technical Depth & Engineering (30%), Problem Value & Impact (25%), and
Presentation & Documentation (15%).

| Rank | Why this could lose first place | Status / evidence |
| --- | --- | --- |
| 1 | No Alibaba Cloud deployment proof would violate a technical requirement. | Manual: deploy the included ECS compose configuration and capture the live URL. |
| 2 | Missing video, deck, and final Devpost artefacts. | Manual: `DEMO.md` provides the script; record a <=5-minute video. |
| 3 | No reproducible full-stack deployment path. | Fixed: standalone Next Dockerfile, ECS compose file, and separate secret templates. |
| 4 | Qwen could look like a replaceable OCR/API call. | Improved: dedicated Qwen OCR, reconciled Qwen item extraction, grounded Qwen chat, and source labels. |
| 5 | Persistent memory was implicit, not judge-visible. | Fixed: `/memory` explains private cross-session receipt memory and its sources. |
| 6 | Live demo can fail without service diagnostics. | Improved: `GET /api/health` plus FastAPI `GET /health`. |
| 7 | Synchronous OCR can time out under real traffic. | Open: retain for hackathon simplicity; queue processing is the next production milestone. |
| 8 | README was MVP-oriented and deployment instructions were incomplete. | Improved: deployment and judge-review documentation added. |
| 9 | No live RLS/Qwen integration test evidence. | Open: execute the documented ECS/Supabase smoke test before recording. |
| 10 | Mock fallback can disguise missing production configuration. | Mitigated: health output exposes Qwen/Supabase/processor configuration state. |

## ECS smoke test

1. Copy each `deploy/*.env.example` file to its non-example counterpart and
   fill secrets only on the server.
2. From the repository root run:

   ```bash
   docker compose -f deploy/docker-compose.ecs.yml up -d --build
   curl http://127.0.0.1:3000/api/health
   curl http://127.0.0.1:8001/health
   ```

3. Put Nginx and TLS in front of port 3000. Record the health responses, a
   Qwen-backed upload, a correction/reconciliation, Memory, Spending Story,
   and a cited chat answer for the demo.
