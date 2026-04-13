# Astral Impact Hub

Astral Impact Hub is a greenfield Next.js + Supabase platform scaffolded from the PRD in `/Users/bunny/Downloads/Astral_Impact_Hub_PRD_v1.0.docx`.

## Stack
- Next.js 15 App Router
- Tailwind CSS v4
- Supabase Auth, Postgres, Storage, Edge Functions
- Vercel deployment + Analytics
- Sentry-ready monitoring hooks
- Zod + React Hook Form contracts

## What is implemented
- Production-minded repository scaffold with GitHub CI, Vercel cron config, and environment template
- App Router shell with branded landing page, cookie-based demo auth, role-aware dashboard routes, and shared component system
- Typed domain contracts, interactive server-side demo store, and AI provider abstraction
- Initial Supabase migration, seeds, RLS baseline, and named edge-function stubs
- Project/Vendor CRUD, vendor update workflow, manager approvals, generated content flow, distribution log, email template, and health endpoint

## Next recommended steps
1. Run `npm install`
2. Run `npm run typecheck`
3. Fill `.env.example` values into `.env.local`
4. Connect a Supabase project and apply `supabase/migrations/0001_initial_schema.sql`
5. Swap the demo store in `lib/data/demo-store.ts` for live Supabase repositories
6. Connect the repo to Vercel and GitHub

## Project structure
- `app/` routes, layouts, API entry points
- `components/` shared UI and shell
- `features/` module-oriented UI sections
- `lib/` auth, Supabase, AI, constants, helpers
- `types/` zod contracts and domain types
- `emails/` transactional email templates
- `supabase/` SQL migrations, seeds, and edge functions
