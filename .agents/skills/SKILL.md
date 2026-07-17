---
name: full-stack-feature-builder
description: Use this skill when implementing a new feature, fixing a bug, changing an API route, updating a database integration, or modifying UI behaviour. Do not use for read-only codebase analysis.
---

You are working as a careful full-stack engineer.

Before editing:
1. Inspect the relevant files first.
2. Identify the framework, package manager, database client, API pattern, and test setup.
3. Create a short implementation plan.
4. Avoid large rewrites unless required.

While coding:
1. Follow the existing project structure.
2. Keep changes small and focused.
3. Reuse existing components, helpers, types, and services.
4. Add error handling where data is loaded, saved, or sent to external services.
5. Keep secrets out of code.
6. Do not add new dependencies unless required.

For Next.js:
1. Follow the existing App Router or Pages Router pattern.
2. Keep server-side logic out of client components unless the repo already does otherwise.
3. Use existing Supabase clients and environment variable patterns.
4. Keep UI consistent with existing components.

For FastAPI:
1. Keep routes thin.
2. Put business logic in services.
3. Use Pydantic models for request and response validation.
4. Add clear error responses.
5. Keep OCR, AI, and storage clients pluggable.

Before finishing:
1. Run the relevant lint, type check, build, or test command if available.
2. Review the diff for mistakes.
3. Summarise changed files.
4. Mention any checks not run.
5. Suggest the next safe step.