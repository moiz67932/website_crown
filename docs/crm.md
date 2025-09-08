# CRM Integration (Lofty-first, Pluggable)

## Env Vars
```
CRM_PROVIDER=lofty
LOFTY_API_BASE=https://api.lofty.com/v1
LOFTY_API_KEY=__set_in_production__
LOFTY_WEBHOOK_SECRET=__set_if_supported__
REDIS_URL=
PUBLIC_SITE_URL=http://localhost:3000
```

## Flow
1. Lead form posts to `/api/leads`.
2. UTM + click IDs captured via middleware cookies; merged into payload.
3. Lead scored (`scoreLead`).
4. Enqueued -> `crm.queue` pushes to provider with retries (exp backoff).
5. Provider mapping (`providers/lofty.ts`) transforms fields.
6. Future: webhook from Lofty hits `/api/webhooks/lofty` for status updates.
7. Follow-up automation placeholder in `followup.ts`.

## Provider Interface
`createCRM()` returns an object implementing:
- `pushLead(lead)`
- `verifyWebhookSignature?(payload, signature)` (optional)

Add new provider by placing a file in `providers/` and switching `CRM_PROVIDER`.

## Agent Routing Hints
Use `tags` array on `LeadPayload` to drive Lofty rule-based assignment (e.g. `['pdp','luxury','pool']`).

## Anti-spam
- Honeypot field `company` must remain empty.
- Time-on-page (`__top`) must exceed 1.5s.

## Retry / Dead Letter
- In-memory queue now.
- After 5 failed attempts job is logged as dead-letter (stdout). Replace with Redis later.

## TODO When Lofty Access Available
- Confirm endpoint & field names; adjust `mapToLofty`.
- Implement real webhook signature verification.
- Add follow-up triggers (email/SMS) inside webhook handler or after push confirmation.

## Adding Fields
Extend `LeadPayload`, map in `mapToLofty`, and update forms / API route.

## QA Checklist
- Submit landing page form: lead appears with UTM + score.
- Submit property page with `tags=['pdp']`: tag visible downstream.
- Force network failure -> observe retries & dead-letter after max attempts.
- Webhook POST with sample JSON logs event.