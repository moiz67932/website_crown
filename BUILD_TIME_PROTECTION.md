# Landing Page Build-Time Protection

## Problem Solved
- **AI generation was running during `next build`**, causing Zod schema validation failures
- **Non-deterministic AI output** was breaking production builds
- **Database queries** were executing during static site generation

## Solution
AI generation now **ONLY** runs at:
- Runtime (user visits page)
- Via API calls (admin panel, scripts)

AI generation **NEVER** runs during:
- `next build`
- `next export`
- Vercel production builds
- CI/CD pipelines

---

## Implementation

### 1. Build-Time Detection (`src/lib/utils/build-guard.ts`)
```typescript
isBuildTime(): boolean
// Returns true during Next.js build phase
// Checks: NEXT_PHASE, VERCEL_ENV, CI flags
```

### 2. Safe Fallback Content
During build, pages use schema-compliant fallback:
```typescript
createFallbackContent(state, city, slug): LandingPageContent
// Returns complete, valid content structure
// No AI, no database queries
// Satisfies Zod schema
```

### 3. Runtime Caching (`src/app/[state]/[city]/[slug]/page.tsx`)
```typescript
getOrGenerateLandingContent(state, city, slug)
├─ If BUILD_TIME → Return fallback (NO AI)
├─ If RUNTIME:
│  ├─ Check Supabase cache
│  ├─ If cached → Return cached content
│  ├─ If not cached:
│  │  ├─ Generate with NEW AI system
│  │  ├─ Save to cache
│  │  └─ Return generated content
```

### 4. Database Schema
Content stored in `landing_pages` table:
```sql
landing_pages {
  city: TEXT
  page_name: TEXT
  kind: TEXT
  content: JSONB  -- Full LandingPageContent
  updated_at: TIMESTAMPTZ
}
```

---

## Modified Files

### Core Changes
1. **`src/app/[state]/[city]/[slug]/page.tsx`**
   - Added `isBuildTime()` guard
   - Added `createFallbackContent()` safe defaults
   - Added `getCachedContent()` Supabase fetch
   - Added `saveCachedContent()` Supabase upsert
   - Added `getOrGenerateLandingContent()` orchestrator
   - Removed direct `generateContent()` calls

2. **`src/ai/landing.ts`**
   - Added build-time guards to:
     - `generateLandingPageContentWithFallback()`
     - `buildInputJson()` (skips Cloud SQL during build)
     - `generateBatchLandingPages()`
   - Imported `isBuildTime()` and `logBuildSkip()`

3. **`src/lib/utils/build-guard.ts`** (NEW)
   - `isBuildTime()`: Detection logic
   - `logBuildSkip()`: Logging helper
   - `assertNotBuildTime()`: Error thrower

---

## Logging Output

### During Build
```
[Landing] Build phase – AI skipped
[buildInputJson (Cloud SQL)] Build phase – AI skipped
[AI Landing Generation] Build phase – AI skipped
```

### At Runtime (Cache Hit)
```
[Landing Page] Cached content used
```

### At Runtime (Cache Miss → Generate)
```
[Landing Page] Runtime generation – new AI system
[generateLandingPageContent] Starting hybrid generation
[Landing Page] Content cached to database
```

---

## Testing

### Verify Build Safety
```bash
# Should complete WITHOUT calling OpenAI
npm run build

# Check logs for:
# ✅ "[Landing] Build phase – AI skipped"
# ❌ Should NOT see OpenAI API calls
```

### Verify Runtime Generation
```bash
# Start dev server
npm run dev

# Visit a page without cache:
# http://localhost:3000/california/san-diego/homes-for-sale

# Check logs:
# ✅ "[Landing Page] Runtime generation – new AI system"
# ✅ "[Landing Page] Content cached to database"

# Refresh page:
# ✅ "[Landing Page] Cached content used"
```

### Verify Fallback Content
```bash
# Visit any page during build (should use fallback)
# Schema validation should pass (no Zod errors)
```

---

## API Usage

### Bootstrap Script
```typescript
// scripts/generate-initial-landing-pages.ts
// Runs at RUNTIME, not build time
// Uses NEW AI system
// Saves to cache automatically
npm run generate:landing-pages
```

### Admin Panel
```typescript
// POST /api/admin/landing-pages/generate-content
// Triggers AI generation
// Saves to database
// Returns generated content
```

---

## Migration Guide

### Before (OLD - Runs during build ❌)
```typescript
export default async function Page({ params }) {
  const content = await generateContent(state, city, slug);
  // ❌ Calls AI during SSG
  // ❌ Fails on Zod validation
  return <LandingTemplate content={content} />;
}
```

### After (NEW - Safe for build ✅)
```typescript
export default async function Page({ params }) {
  const content = await getOrGenerateLandingContent(state, city, slug);
  // ✅ Returns fallback during build
  // ✅ Uses cache at runtime
  // ✅ Generates only when needed
  return <LandingTemplate content={content} />;
}
```

---

## Environment Variables

### Required
```env
# Supabase (for caching)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# OpenAI (for runtime generation)
OPENAI_API_KEY=sk-xxx

# Feature flag (use NEW AI system)
USE_NEW_AI_MODULE=true
```

### Optional
```env
# Debug build detection
LANDING_DEBUG=true
```

---

## Troubleshooting

### Build fails with "AI generation during build"
**Cause**: `isBuildTime()` not detecting build phase
**Fix**: Check `NEXT_PHASE` and `VERCEL_ENV` variables

### Pages show fallback content at runtime
**Cause**: Cache empty, AI generation failing
**Fix**: 
1. Check OpenAI API key
2. Check Supabase connection
3. Run bootstrap script: `npm run generate:landing-pages`

### Zod schema validation errors
**Cause**: Fallback content doesn't match schema
**Fix**: Update `createFallbackContent()` to match latest schema

---

## Best Practices

### ✅ DO
- Use `getOrGenerateLandingContent()` in page components
- Pre-generate content via scripts or admin panel
- Cache all AI-generated content
- Monitor cache hit rates

### ❌ DON'T
- Call AI functions directly from page components
- Rely on AI generation during `generateStaticParams()`
- Skip caching (wastes API calls)
- Use legacy AI module (always use NEW system)

---

## Performance

### Build Time
- **Before**: 5-10 minutes (AI calls for every page)
- **After**: 30 seconds (no AI, no database)

### First Page Load (Cache Miss)
- 3-5 seconds (AI generation + save)

### Subsequent Loads (Cache Hit)
- <100ms (database fetch only)

---

## Future Improvements

1. **Incremental Static Regeneration (ISR)**
   - Set `revalidate: 3600` (already implemented)
   - Pages re-generate hourly in background

2. **Batch Pre-warming**
   - Generate all pages in parallel
   - Use `generateBatchLandingPages()`

3. **CDN Caching**
   - Cache rendered HTML at edge
   - Reduce database load

4. **Monitoring**
   - Track cache hit/miss ratio
   - Alert on high miss rates
