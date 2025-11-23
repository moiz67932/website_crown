# Landing Page Content & Image Display Fixes

## Issues Fixed

### 1. **Repetitive AI Content** ❌ → ✅
**Problem:** The homes-under-500k landing page was generating extremely repetitive content with phrases like "Los Angeles offers a range of options" repeated throughout, and cut-off sentences.

**Root Cause:** 
- The AI prompt in `src/lib/ai/prompts/landings.ts` was too generic and short
- It lacked specific instructions to avoid repetition
- No clear content structure was defined

**Solution:**
- Completely rewrote the `ai_city_homes_under_500k` prompt with:
  - **Minimum 1,500 words** requirement for comprehensive content
  - **Explicit anti-repetition rules**: "NO repetitive phrases", "Each paragraph must provide NEW information"
  - **Structured HTML output**: 10 specific sections with 100-250 word requirements each
  - **Topic-specific guidance** for each section (financing, neighborhoods, renovation, etc.)
  - **Quality standards**: Natural human writing, varied vocabulary, conversational but professional
- Added OpenAI parameters to prevent repetition:
  - `presence_penalty: 0.6` - penalizes repetition of topics
  - `frequency_penalty: 0.7` - penalizes repetition of exact phrases
  - `temperature: 0.8` - slightly lower for more focused content

### 2. **Missing Inline Images** ❌ → ✅
**Problem:** Images were stored in the database (`inline_images_json`) but not displaying on the page.

**Root Cause:**
- The `AIDescription.tsx` component had incorrect image indexing logic
- Images were only shown on even sections (`index % 2 === 0`) but the math was wrong
- Images weren't being properly fetched or mapped to sections

**Solution:**
- Fixed image display logic in `src/components/landing/sections/AIDescription.tsx`:
  - Images now show after sections 1, 3, 5, 7 (every other section after first)
  - Correct calculation: `imageIndex = Math.floor((index - 1) / 2)`
  - Added debug logging to track image loading and placement
  - Images now use proper alt text from Unsplash or generate contextual alt text

### 3. **Poor Spacing & Typography** ❌ → ✅
**Problem:** No clear visual hierarchy, cramped spacing, hard to read.

**Solution:**
- Enhanced spacing between sections: `space-y-16` (64px gaps)
- Improved typography with Tailwind prose classes:
  - Responsive heading sizes: `text-2xl sm:text-3xl`
  - Better paragraph spacing: `prose-p:mb-6` with relaxed line height
  - First element margin fix: `[&>*:first-child]:mt-0`
- Better image styling:
  - Increased height: `h-[400px] sm:h-[500px]`
  - Enhanced shadow: `shadow-2xl`
  - Smoother hover effect: `duration-500`
  - Improved gradient overlay: `from-black/30 via-black/5`

### 4. **Generic Page Descriptions** ❌ → ✅
**Problem:** All pages said "Discover what makes {city} an excellent choice for condo buyers" regardless of page type.

**Solution:**
- Dynamic page title based on landing type:
  - `homes-under-500k` → "home buyers"
  - `condos-for-sale` → "condo buyers"
  - `homes-with-pool` → "pool home buyers"
  - `luxury-homes` → "luxury home buyers"

## How to Regenerate Content

The old repetitive content is cached in the database. To regenerate:

### Method 1: Use the Regeneration Script
```bash
# For a specific page:
node regenerate-landing-content.js "los angeles" "homes-under-500k"

# List all landing pages:
node regenerate-landing-content.js
```

### Method 2: Direct Database Update (Supabase)
```sql
-- Clear AI content for a specific page
UPDATE landing_pages 
SET ai_description_html = NULL, updated_at = NOW()
WHERE city = 'los angeles' AND page_name = 'homes-under-500k';

-- Or clear all homes-under-500k pages
UPDATE landing_pages 
SET ai_description_html = NULL, updated_at = NOW()
WHERE page_name = 'homes-under-500k';
```

### Method 3: Force Regeneration with Environment Variable
```bash
# Add to .env.local
FORCE_AI_REGEN=1

# Then visit the page - it will ignore cached content
```

## Testing the Fix

1. **Clear the cache** (use Method 1 above)
2. **Visit the page**: http://localhost:3000/california/los-angeles/homes-under-500k
3. **Check for:**
   - ✅ Unique content in each paragraph (no repetition)
   - ✅ Images appearing between sections
   - ✅ Good spacing and readability
   - ✅ Complete sentences (no cut-offs)
   - ✅ Proper section headings (H2 tags)
   - ✅ Natural, human-like writing

## Files Modified

1. **`src/lib/ai/prompts/landings.ts`**
   - Completely rewrote `ai_city_homes_under_500k` prompt
   - Added detailed structure with 10 sections
   - Added quality standards and anti-repetition rules

2. **`src/components/landing/sections/AIDescription.tsx`**
   - Fixed image display logic and indexing
   - Improved typography and spacing
   - Added debug logging
   - Made page title dynamic based on landing type
   - Enhanced responsive design

3. **`src/lib/landing/ai.ts`** (already had good OpenAI parameters)
   - System prompt emphasizes variety and no repetition
   - Presence and frequency penalties to avoid duplication

4. **`regenerate-landing-content.js`** (new script)
   - Helper script to clear cached content
   - Lists all landing pages
   - Can target specific city/page combinations

## Content Quality Standards

The new prompt enforces these quality rules:

### ✅ DO:
- Write 100-250 words per paragraph
- Provide unique information in each section
- Use varied vocabulary and sentence structures
- Be specific about the city and market
- Include practical buyer advice
- Sound like a knowledgeable human expert

### ❌ DON'T:
- Repeat phrases like "Los Angeles offers a range of options"
- Use generic template language
- Cut off sentences mid-thought
- Fabricate statistics or data
- Use robotic phrasing
- Repeat the same sentence patterns

## Before & After Example

### Before (Repetitive & Low Quality):
```
Los Angeles offers a range of options when it comes to homes under 500k. 
On neighborhood character and popular areas to consider, buyers should 
consider local nuances and personal priorities...

Los Angeles offers a range of options when it comes to homes under 500k. 
On typical housing stock and what different buyers look for, buyers should 
consider local nuances and personal priorities...
```

### After (Unique & High Quality):
```
Finding affordable homes under $500k in Los Angeles requires strategic 
thinking and realistic expectations. In LA's competitive market, this 
budget typically opens doors to condos in developing neighborhoods, 
townhomes in suburban pockets, or single-family fixer-uppers in 
transitioning areas...

[Next section has completely different content about neighborhoods]

When searching for homes under $500k in Los Angeles, buyers encounter 
specific neighborhoods where this price point is more realistic. Areas 
like Van Nuys in the San Fernando Valley, portions of South Los Angeles, 
and emerging pockets of East LA offer opportunities...
```

## Image Display Logic

Images are inserted strategically throughout the content:

```
Section 0 (Intro)      → No image
Section 1 (Content)    → No image
Section 2 (Content)    → ✅ Image 1 (inline_1)
Section 3 (Content)    → No image
Section 4 (Content)    → ✅ Image 2 (inline_2)
Section 5 (Content)    → No image
Section 6 (Content)    → ✅ Image 3 (inline_3)
Section 7 (Content)    → No image
Section 8 (Content)    → ✅ Image 4 (inline_4)
```

This creates a balanced reading experience with images breaking up long text sections.

## Environment Variables

Relevant environment variables for landing pages:

```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-...              # Required for AI generation
OPENAI_MODEL=gpt-4o-mini           # Model to use
OPENAI_MAX_TOKENS=3000             # Max tokens per request
OPENAI_TIMEOUT_MS=25000            # Timeout for API calls

# Landing Page Settings
LANDING_MIN_WORDS=1200             # Minimum content length
LANDING_MAX_WORDS=2000             # Maximum content length
FORCE_AI_REGEN=1                   # Force regeneration (ignore cache)
SKIP_LANDING_EXTERNAL_FETCHES=1    # Skip Unsplash/OpenAI (use fallbacks)
LANDING_TRACE=1                    # Enable detailed logging
LANDING_DEBUG=1                    # Enable debug logging

# Unsplash Images
UNSPLASH_ACCESS_KEY=...            # For hero and inline images
```

## Next Steps

1. ✅ Clear cached content for Los Angeles homes-under-500k
2. ✅ Visit page to trigger regeneration
3. ✅ Verify images display correctly
4. ✅ Check content quality (no repetition, good structure)
5. 🔄 Optionally regenerate other landing pages if needed
6. 🔄 Monitor console logs for any errors

## Troubleshooting

**Q: Images still not showing?**
- Check browser console for image loading errors
- Verify `inline_images_json` has data in Supabase
- Check Unsplash API key is set
- Look for 404 errors on image URLs

**Q: Content still repetitive?**
- Ensure you cleared the cache (ran regeneration script)
- Check that `FORCE_AI_REGEN=1` is NOT set (it bypasses cache)
- Verify the page is actually regenerating (check console logs)

**Q: Generation taking too long?**
- OpenAI calls can take 10-30 seconds for long content
- Check `OPENAI_TIMEOUT_MS` setting
- Watch console for timeout errors

**Q: Want to customize content?**
- Edit the prompt in `src/lib/ai/prompts/landings.ts`
- Change `LANDING_MIN_WORDS` / `LANDING_MAX_WORDS`
- Adjust OpenAI parameters in `src/lib/landing/ai.ts`

## Monitoring & Logging

Enable detailed logging to debug issues:

```bash
LANDING_TRACE=1  # Shows detailed step-by-step logging
LANDING_DEBUG=1  # Shows debug information
```

Console output will show:
- AI prompt preview
- OpenAI response preview
- Image loading status
- Section parsing details
- Cache hits/misses

Example console output:
```
🎨 [AIDescription] Rendering: { city: 'Los Angeles', kind: 'homes-under-500k' }
📊 [AIDescription] Parsed sections: 10
🖼️ [AIDescription] Loaded images: 4 [ 'inline_1', 'inline_2', 'inline_3', 'inline_4' ]
📄 [AIDescription] Section 2: { hasHeading: true, shouldShowImage: true, hasImage: true }
```

---

**Status:** ✅ All fixes implemented and ready for testing
**Last Updated:** 2024-11-23
