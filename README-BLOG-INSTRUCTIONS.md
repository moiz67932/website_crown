# Blog generation & image pipeline

This document explains how to run the blog generation flow locally and what env variables / DB migrations are required.

Required environment variables (server-side):
- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_ANON_KEY for read-only)
- OPENAI_API_KEY
- UNSPLASH_ACCESS_KEY
- CRON_SECRET (used by cron publish endpoint)
- BRAND_NAME (optional, default: Crown Coastal Homes)
- BRAND_AGENT (optional)

Apply DB migration:
- Run the SQL file `supabase/migrations/20250916_add_post_images.sql` against your Supabase DB.

Next.js images config:
- Add `images.domains = ['images.unsplash.com']` (or the appropriate hosts) to `next.config.js` so `next/image` can load Unsplash images.

Quick PowerShell flow (example):

1) Generate blog

Invoke-RestMethod -Uri "http://localhost:3000/api/blog/generate" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body (@{ type="moving"; city="San Diego"; nearby=@("La Jolla","Encinitas"); options=@{ makeAB=$true; linkPropertiesLimit=3 } } | ConvertTo-Json -Depth 10)

Example response: `{ "ok": true, "postId": "uuid-here", "slug":"san-diego-..." }`

2) Fetch Unsplash images

Invoke-RestMethod -Uri "http://localhost:3000/api/blog/images" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body (@{ postId="uuid-here"; heroImagePrompt="San Diego relocation lifestyle"; imagePrompts=@("moving boxes in modern home","family settling in San Diego","city skyline aerial","coastal neighborhood street") } | ConvertTo-Json -Depth 10)

3) Schedule & publish via cron

-- Run SQL to schedule the post (example, replace uuid):
update posts set status='scheduled', scheduled_at=now() - interval '1 minute' where id='uuid-here';

-- Trigger the cron publish endpoint
Invoke-RestMethod -Uri "http://localhost:3000/api/cron/publish" -Headers @{ "x-cron-secret"="$env:CRON_SECRET" }

Scripted helper:
- `scripts/generate-blog.ps1` provides a minimal PowerShell wrapper automating the above three steps.
