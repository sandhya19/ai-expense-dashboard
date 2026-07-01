# ExpenseAI Dashboard

A production-oriented AI receipt dashboard built with Next.js 15, TypeScript, Tailwind CSS, shadcn-style Radix components, Supabase, Recharts, React Hook Form, and Zod.

## Included

- Responsive dashboard with collapsible desktop sidebar
- Dark and light themes
- Server Component data loading
- Supabase Postgres, Storage, authentication-ready access, and RLS policies
- Receipt upload and mobile camera capture
- KPI cards, line chart, pie chart, bar chart, and recent receipts table
- Skeleton loading and route error state
- Mock-data fallback when Supabase environment variables are absent
- Routes for Documents, AI Chat, Analytics, and Settings

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Copy `.env.example` to `.env.local`.
4. Add the project URL and publishable key.
5. Add your preferred Supabase sign-in screens and session-refresh middleware before live deployment.

Without environment variables, the dashboard uses demo data. The upload route also returns a demo response.

## Production checks

```bash
npm run typecheck
npm run build
```

## AI processing extension

Create a worker triggered by new `processing` receipts. The worker should fetch the private Storage object, run OCR or a vision model, validate structured output, and update the row to `review`, `completed`, or `failed`.
