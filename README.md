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
6. Configure Supabase Storage with the `project-media` bucket (or update `NEXT_PUBLIC_SUPABASE_MEDIA_BUCKET`)
7. Connect the repo to Vercel and GitHub

## Registration emails

New employee and CSR Associate accounts can receive a welcome email containing their user ID, temporary password, and portal login link. Configure these environment variables locally and in Vercel:

- `RESEND_API_KEY`: API key from Resend.
- `EMAIL_FROM`: sender using a domain verified in Resend, for example `Astral Foundation <portal@foundation.org>`.
- `NEXT_PUBLIC_APP_URL`: deployed portal URL used by the sign-in button.

Account creation remains successful when email delivery fails; the portal displays a warning so the creator can correct the email configuration without recreating the account. CSR Associates can replace their temporary password from **My Profile** after signing in.

## Project structure
- `app/` routes, layouts, API entry points
- `components/` shared UI and shell
- `features/` module-oriented UI sections
- `lib/` auth, Supabase, AI, constants, helpers
- `types/` zod contracts and domain types
- `emails/` transactional email templates
- `supabase/` SQL migrations, seeds, and edge functions

### Communications: generation, review, and verified sharing

1. Apply `supabase/migrations/0006_communication_workflow.sql` in the Supabase SQL editor (or your normal migration pipeline). It adds content review metadata, atomic version checks, and duplicate-send protection. RPCs are service-role only; existing drafts are unapproved. No existing rows are deleted.
2. Configure `ANTHROPIC_API_KEY` and `ANTHROPIC_MODEL` with a model available to your account. Generation sends only the selected project's brief and update facts to Anthropic, validates every output, and never saves fallback text. Existing placeholder drafts must be regenerated. See [Claude Messages API](https://platform.claude.com/docs/en/api/messages).
3. In Communications, generate, edit all channel drafts, select an optional JPEG from the update for Instagram, save, and submit for approval. An administrator approves that exact version. Editing or regenerating removes approval. Changed source facts require another review; sensitive updates are blocked.
4. Sharing requires explicit confirmation of the message and destination. Telegram uses `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHANNEL_ID`; the bot must have permission to post to that channel. See [Telegram sendMessage](https://core.telegram.org/bots/api#sendmessage).
5. WhatsApp uses `WHATSAPP_API_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `META_GRAPH_VERSION`. Enter an opted-in recipient with country code. This integration sends free-form text within the 24-hour customer-service window; outside that window use an approved template through your WhatsApp tooling. It does not silently send free-form messages as templates. A message ID is shown as **accepted**, not delivered.
6. For signed WhatsApp delivery callbacks, set `META_APP_SECRET` and a random `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Register `https://YOUR_APP/api/webhooks/whatsapp` with Meta and subscribe to message status events. The endpoint validates `X-Hub-Signature-256`, checks the phone-number ID, and records sent/delivered/read/failed callbacks without downgrading a later status.
7. Instagram uses `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_ACCOUNT_ID`, and `META_GRAPH_VERSION`, with a Facebook-linked professional account and content-publishing permissions. This release publishes a single selected JPEG plus the approved long caption. It creates a container, waits for processing, then publishes and stores the returned media ID. Reels/carousel copy is editable but video/carousel publishing is not implemented. See [Meta's Instagram collection](https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api).

Never expose these credentials in `NEXT_PUBLIC_` variables. Restart the application after changing environment configuration. Channel configuration is not proof that a token is valid: each actual send checks the provider response. Old history without provider receipts is **unverified** and is excluded from successful-share metrics.

Timeouts during publishing are **unknown**, not failed: a provider may have processed the request. The same version/destination is blocked from automatic resend. Sending/unknown rows also block draft replacement until an administrator checks the provider and reconciles that row in Supabase. Do not blindly change it to failed: use failed only when non-delivery is verified, or store its provider receipt and actual status. Local file storage is supported only for development; production communications require Supabase.

Update history on Projects and Updates supports text search, exact day, month, year, and pagination. Rejected updates are hidden by default, accessible through “Include rejected updates.” Photos and videos use authenticated, scope-checked access with short-lived storage URLs; no records are deleted by filtering.

To run a production preview alongside an existing development server, use `NEXT_DIST_DIR=.next-preview npm run build`, then `NEXT_DIST_DIR=.next-preview npm run start -- --port 3011`. Both commands must use the same directory so development compilation cannot overwrite the preview's client scripts.

## Project email notifications

See [email notification setup](docs/email-notifications.md) for Resend domain verification, migration `0007_email_notifications.sql`, production configuration, recipient rules, and recovery. Sending is disabled until `EMAIL_NOTIFICATIONS_ENABLED=true`; preview deployments cannot send these notifications.
