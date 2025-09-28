# Supabase Unification

Date: 2025-09-27

## Goal
Standardize all auth + data access on a single Supabase project (Project A).

## Canonical Environment Variables

```
SUPABASE_URL=... (Project A)
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_SUPABASE_URL=https://same-as-project-a.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=same-anon-key
```

NEXT_PUBLIC_* MUST match the private counterparts. In Vercel set both manually (no interpolation expansion).

## Client Factories
`src/lib/supabase.ts`
```
export function supaServer() { ... service role client }
export function supaBrowser() { ... anon key client }
```
All code imports only these. No other `createClient` calls remain.

## Auth Service
`SupabaseAuthService` now uses only `supaServer()`.

## Migration
`supabase/migrations/20250927_unify_project.sql` adds / enforces:
* `public.users` (id FK -> auth.users)
* Trigger `trg_auth_users_after_insert_profile` to auto-create profile row
* Basic RLS self-read policy

Apply via Supabase CLI:
```
npx supabase link --project-ref <PROJECT_A_REF>
npx supabase db push
```

## Verification SQL
```
select id,email,created_at from auth.users order by created_at desc limit 5;
select u.id,u.email,u.created_at from public.users u join auth.users a on a.id=u.id order by u.created_at desc limit 5;
select tgname, pg_get_triggerdef(oid) from pg_trigger where tgrelid='auth.users'::regclass and tgname='trg_auth_users_after_insert_profile';
```

## Dev Diagnostics
`src/lib/supabase-check.ts` provides `assertSameProjectOrThrow` & `ensureAuthUserExists`.

## Acceptance Checklist
- [ ] SUPABASE_URL === NEXT_PUBLIC_SUPABASE_URL
- [ ] All Supabase clients from `src/lib/supabase.ts`
- [ ] No hardcoded supabase.co refs outside env files
- [ ] Registration creates auth user and profile row (trigger)
- [ ] Trigger present
- [ ] Dev warning if envs drift

## Prod Verification Steps
1. Set/confirm env vars in hosting provider (Vercel) for prod & preview.
2. Deploy.
3. Create a test signup; ensure no FK errors.
4. Run verification SQL.
5. Hit (dev only) /api/debug/supabase to confirm `sameProject=true` (not exposed in prod).

## Debug Endpoint (dev only)
Implement `/api/debug/supabase` returning masked config and sameProject boolean.

## Test Script Idea
Call registration endpoint, wait 1s, check public.users for new id, then delete user via Auth admin.

## Notes
Service role key is never shipped to browser. Browser uses only anon key via `supaBrowser()`.
