# Landing Page Content - Quick Fix Guide

## Problem Fixed ✅

Landing pages were showing repetitive, short content like:
```
"San Francisco offers a range of options... buyers should consider... 
San Francisco offers a range of options... buyers should consider..."
[REPEATED OVER AND OVER]
```

## What Changed

### 1. **Better AI Prompts**
- Now generates **1,500+ words** (was 800)
- 10 structured sections with unique content
- No more generic filler phrases

### 2. **Smarter AI Settings**
- Added repetition detection and prevention
- Better content validation before saving
- Natural, human-like writing style

### 3. **Improved Page Design**
- Larger, more readable text
- Clear section headings (H2 tags)
- Images between major sections
- Better spacing and formatting

## How to Regenerate Content

### Option 1: Admin Panel (Easiest)
1. Go to `/admin/landing`
2. Find the page (e.g., "San Francisco - condos-for-sale")
3. Click **"Regenerate Content"** button
4. Wait 10-30 seconds
5. Refresh the public page to see new content

### Option 2: Bulk Regeneration (All Cities)
1. Go to `/admin/landing`
2. Click **"Generate All Pages"** at top
3. This will regenerate content for all cities
4. Takes several minutes

### Option 3: API Call (For Developers)
```bash
curl -X POST http://localhost:3000/api/admin/landing-pages/{page-id}/regenerate
```

## Checking if Content is Good

✅ **Good Content:**
- 1,500+ words total
- 10 different sections with H2 headings
- Each paragraph discusses different topic
- Natural, readable language
- Images appear every other section

❌ **Bad Content (needs regeneration):**
- Less than 800 words
- Same sentence repeated multiple times
- Generic phrases like "offers a range of options"
- No clear section structure

## Troubleshooting

### Content Still Repetitive?
1. Check if `OPENAI_API_KEY` is set correctly in `.env`
2. Try regenerating again (AI can vary)
3. Check console logs for errors during generation

### Content Too Short?
1. Ensure `LANDING_MIN_WORDS=1200` in `.env`
2. Ensure `LANDING_MAX_WORDS=2000` in `.env`
3. Regenerate the content

### Images Not Showing?
1. Check if `UNSPLASH_ACCESS_KEY` is set in `.env`
2. Images fetch from Unsplash during generation
3. Regenerate to fetch new images

## Environment Variables

Add to `.env` for best results:
```env
# Already set
OPENAI_API_KEY=your_key_here
UNSPLASH_ACCESS_KEY=your_key_here

# Optional: Control content length
LANDING_MIN_WORDS=1200
LANDING_MAX_WORDS=2000

# Optional: Enable detailed logs
LANDING_TRACE=1
```

## Example: Good Landing Page Structure

```
About San Francisco

Introduction to San Francisco Condos
[150-200 words about SF condo market]
[IMAGE: SF cityscape]

The San Francisco Condo Market Landscape  
[200-250 words on market characteristics]

Lifestyle Benefits of Condo Living in San Francisco
[200-250 words on amenities & lifestyle]
[IMAGE: Modern condo interior]

Popular Condo Neighborhoods in San Francisco
[250-300 words naming specific areas]

Understanding Condo Ownership
[200-250 words on HOAs, fees, etc.]
[IMAGE: Condo building exterior]

Investment Potential
[150-200 words on rental market]

Transportation & Connectivity
[150-200 words on transit, highways]
[IMAGE: SF transit scene]

Working with Crown Coastal Homes
[200-250 words on our service]

Express Service Advantages
[150-200 words on our benefits]

Ready to Find Your San Francisco Condo?
[150-200 words with call-to-action]
```

## Quick Commands

```bash
# View landing pages in admin
npm run dev
# Then navigate to: http://localhost:3000/admin/landing

# Check a specific landing page
# Navigate to: http://localhost:3000/california/san-francisco/condos-for-sale

# View logs during regeneration
# Check terminal running npm run dev
```

## Support

If content issues persist:
1. Check `LANDING_PAGE_CONTENT_FIXES.md` for technical details
2. Review console logs for API errors
3. Verify environment variables are set
4. Contact development team with specific page URL

---

**Last Updated:** November 23, 2025
**Status:** Production Ready ✅
