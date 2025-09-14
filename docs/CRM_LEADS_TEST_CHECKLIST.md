# 60-Second Leads Test Checklist

1. Open site with UTM params (seeds cookies/local storage):
   http://localhost:3000/?utm_source=seo&utm_medium=organic&utm_campaign=landing-e2e&gclid=TEST123

2. Navigate to a property detail page (PDP).
3. Wait ~2 seconds (anti-spam timer) then fill Contact Form.
4. Submit.
5. Watch dev server logs:
   - Expect: `POST /api/leads 200` then `[crm.queue] pushed <id>`
   - If failure: `[crm.queue] push failed … Lofty push failed: 401 ...` (adjust auth vars)
6. If 401:
   - Try header style:
     LOFTY_AUTH_HEADER=X-API-Key
     LOFTY_AUTH_SCHEME=
   - Or if path differs: LOFTY_LEADS_PATH=/crm/leads
7. Verify in Lofty UI the lead shows:
   - Name (split correctly)
   - Email / Phone
   - City / State / County
   - page_url matches PDP
   - UTM fields populated
   - Tags include: pdp, prop:<id>, property type (lowercased)
8. Confirm no duplicate submissions when rapidly re-clicking.

Success = lead created + correct metadata.
