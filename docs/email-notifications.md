# Project email notifications

Implemented locally; activation requires migration 0007, a verified Resend sender, production environment variables, and deployment. No real emails were sent during implementation.

## What sends an email

- Project creation and changes to project details, status, dates, or manager.
- CSR project links added or removed.
- New activity submissions and activity information edits.
- Approval, rejection, revision requests, and escalation decisions recorded.
- Employee/CSR user project and partner assignment changes, including new assigned accounts.

Recipients are all administrators (including super admins), the project manager, employees assigned directly to the project or through a linked CSR associate, linked CSR account users, and the linked CSR organisation's contact email. Addresses are normalized and deduplicated per event. Each address gets an individual message; other recipients are never exposed. The person making the change is included if eligible. Removed members do not receive queued messages after their access ends.

Emails contain the event, project name, changed project field names, and portal link. Activity submissions and decisions also identify the submitting/reviewing user. Project edits currently have no recorded actor identity. Activity text, reviewer comments, credentials, and attachments are excluded. People must sign in to read details allowed by their account permissions.

CSR contact/profile changes, media-only changes, project deletion, and general content/distribution changes are outside this notification scope. Existing welcome-email code is separate from this queue. No historical data is backfilled.

## Resend and DNS setup

1. Create/sign into [Resend](https://resend.com), then open **Domains → Add domain**.
2. Use a domain you own. Recommended sender subdomain: `updates.YOUR-DOMAIN`, with sender `notifications@updates.YOUR-DOMAIN`. Resend recommends subdomains to separate sending reputation: [verified domains](https://resend.com/docs/dashboard/domains/introduction).
3. Copy the exact DNS records Resend displays into the DNS provider for that domain. These verify sending ownership/authentication (SPF and DKIM); see [Resend’s domain setup steps](https://resend.com/docs/add-a-domain). Preserve existing business-mail MX records; use the exact hostnames shown, not invented root-domain replacements. Return to Resend and verify until the domain is marked verified. Receiving email is not needed for these notifications.
4. In **API Keys**, create an application key with **Sending access**, restricted to that domain. Store it directly in Vercel; do not put it in chat or Git. [API key documentation](https://resend.com/docs/dashboard/api-keys/introduction).

## Production activation

In Vercel → Astral Impact Hub → Settings → Environment Variables, configure **Production**:

| Variable | Value |
| --- | --- |
| `RESEND_API_KEY` | The Resend sending key |
| `EMAIL_FROM` | `Astral Foundation <notifications@updates.YOUR-DOMAIN>` |
| `NEXT_PUBLIC_APP_URL` | The stable HTTPS portal URL, not a temporary deployment URL |
| `EMAIL_NOTIFICATIONS_ENABLED` | `true` when ready to activate |
| `CRON_SECRET` | A securely generated random secret, e.g. `openssl rand -hex 32` |

The existing Supabase URL and service-role key must remain configured. Keep notification sending disabled in local/demo and Preview environments. The worker also explicitly refuses Vercel Preview deliveries.

Before enabling:

1. Apply `supabase/migrations/0007_email_notifications.sql` and `supabase/migrations/0008_personalized_project_emails.sql` with your normal Supabase migration process (requires the existing schema through migration 0003). These add the queue, restricted functions, transactional triggers, and the names used in personalized emails. Existing queued events remain readable; historical project records are not backfilled.
2. Deploy the notification code and configure the authenticated cron at `/api/cron/email-notifications`. `vercel.json` runs recovery every minute. Minute-level cron requires Vercel Pro or Enterprise; Hobby supports daily cron only: [cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing). Immediate attempts run after the app saves; cron recovers interruptions and drains larger queues.
3. Set the production variables and redeploy. [Vercel environment settings](https://vercel.com/docs/environment-variables/managing-environment-variables).
4. Make a controlled change to a project whose assigned recipients are known. Verify each intended recipient's inbox and the matching Resend log. Check that unrelated staff and CSR users received nothing.

Applying the migration begins queueing new changes, even if sending is disabled. Review pending rows before enabling after a long pause. Enabling sends that backlog. Disabling stops new delivery attempts, not an already-running request.

## Delivery and recovery

The database queues recipients in the same transaction as each relevant row change, so rolled-back changes produce no email. Each event is distinct: creating a project and then linking a CSR associate can generate separate creation and assignment messages. No-op project saves, computed score changes, unchanged links, and approval status synchronization do not generate duplicate events.

The existing app performs some multi-table operations in separate transactions. Notifications describe committed row changes, not a guarantee that every later step in a multi-step operation succeeded. If a request dies between steps, already committed changes and their notifications remain. Schema migration failures fail the associated database transaction rather than silently losing the notification.

Workers claim rows using leases and lock skipping. They freeze the sender and body before calling Resend, and reuse a stable idempotency key on retries. Temporary failures retry with backoff, up to eight attempts and within 23 hours of the first attempt. This is inside [Resend's 24-hour idempotency window](https://resend.com/docs/dashboard/emails/idempotency-keys). An interrupted worker's five-minute lease can be recovered. Permanent rejections and expired retry windows require administrator review.

The worker records **accepted**, not **delivered**: provider acceptance is not proof of inbox delivery. Inspect Resend for bounce/delivery details. Inbox delivery webhooks and an in-app delivery dashboard are not included.

Notification emails greet recipients by first name when available and use plain-language subjects and messages. They include the actor when the app records one, and identify the affected person or partner for assignment changes. Emails link to the project so recipients can sign in and review the details they are allowed to see.

Inspect via the Supabase SQL editor (administrator/service-role only):

```sql
select status, count(*) from public.email_notifications group by status;
select id, event_label, status, attempts, provider_id, last_error, created_at
from public.email_notifications
where status in ('failed','sending','pending')
order by created_at;
```

For permanent failure, correct the sender/domain/recipient or provider configuration and reconcile the original request in Resend. Do not blindly reset a failed row after 24 hours: the original may have been accepted and its deduplication key may have expired. A deliberate resend requires confirming whether delivery already occurred. Queue payloads include recipient addresses and project metadata, so keep this table restricted and apply your organisation's retention policy.

## Verification performed

- `npm test`: notification formatting, private recipient requests, stable retry keys, provider failures, and cron authentication, alongside existing tests.
- `npm run typecheck`.
- Isolated PostgreSQL (PGlite) integration: migration execution, recipient selection and deduplication, rollback, no-op suppression, concurrent claims, recovery, retry expiry, sensitive-content exclusion, revoked membership, assignment events, and service-role function permissions.

Run the SQL check with an installed PGlite module (never against production):

```sh
PGLITE_MODULE=/absolute/path/to/@electric-sql/pglite/dist/index.js node scripts/test-email-notifications.mjs
```

Real Resend delivery and the production migration still need activation-time verification.
