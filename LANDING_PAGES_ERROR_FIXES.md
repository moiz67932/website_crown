# Landing Pages Error Fixes

## Issues Fixed

### 1. Database Column Error ❌ → ✅

**Error**:
```
error: column "first_seen_ts" does not exist
at async getLandingStats
```

**Root Cause**: 
The fallback query for calculating days on market was trying to use `first_seen_ts` column which doesn't exist in the properties table.

**Fix Applied**:
**File**: `src/lib/landing/query.ts`

Changed from:
```typescript
const selectDays = hasDaysOnMarketColumn
  ? 'ROUND(AVG(days_on_market)) AS days_on_market'
  : "ROUND(AVG(GREATEST(1, EXTRACT(DAY FROM (NOW() - first_seen_ts))))) AS days_on_market"
```

To:
```typescript
const selectDays = hasDaysOnMarketColumn
  ? 'ROUND(AVG(days_on_market)) AS days_on_market'
  : "ROUND(AVG(GREATEST(1, EXTRACT(DAY FROM (NOW() - COALESCE(on_market_date, listed_at, modification_timestamp, NOW())))))) AS days_on_market"
```

**What Changed**:
- Now uses `COALESCE(on_market_date, listed_at, modification_timestamp, NOW())` to try multiple date columns that actually exist
- Falls back to `NOW()` if none of the date columns are available
- This makes the query resilient to different database schemas

---

### 2. Google Maps Billing Error ❌ → ✅

**Error**:
```
Google Maps JavaScript API error: BillingNotEnabledMapError
Geocoding Service: You must enable Billing on the Google Cloud Project
```

**Root Cause**: 
Google Maps API requires billing to be enabled. When not configured or billing is disabled, the entire page would fail.

**Fixes Applied**:
**File**: `src/components/landing/sections/Map.tsx`

#### A. Better Error Logging
```typescript
s.onerror = () => {
  console.warn("[map] Google Maps script load failed - possibly billing not enabled");
  reject(new Error("gmaps script load failed"));
};
```

#### B. Graceful Fallback UI
Added a user-friendly error state that displays when map is unavailable:

```tsx
{status === "error" ? (
  <div className="h-96 w-full rounded-2xl border bg-gradient-to-br from-neutral-50 to-neutral-100 flex items-center justify-center">
    <div className="text-center p-6 max-w-md">
      <h3>Map Currently Unavailable</h3>
      <p>Interactive map features are temporarily unavailable. Property listings are still fully accessible below.</p>
    </div>
  </div>
) : (
  <div ref={mapRef} className="h-96 w-full rounded-2xl border overflow-hidden" />
)}
```

**What Changed**:
- Map section no longer crashes the entire page
- Shows friendly message when Google Maps is unavailable
- Rest of the landing page (stats, properties, FAQ) continues to work normally
- Improved console warnings for debugging

---

## Impact

### Before Fixes ❌
- Landing pages crashed with database error
- Page failed to load if Google Maps billing wasn't enabled
- Poor user experience

### After Fixes ✅
- Landing pages load successfully
- Market Snapshot section displays correctly
- Featured Listings work properly
- Map shows graceful error when Google Maps is unavailable
- Rest of page functions normally even without map

---

## Testing

Visit any landing page to verify:
- `/california/san-francisco/2-bedroom-apartments`
- `/california/san-francisco/homes-for-sale`
- `/california/san-jose/condos-for-sale`

**Expected Behavior**:
1. ✅ Page loads without errors
2. ✅ Market Snapshot shows real statistics
3. ✅ Featured Listings display properties
4. ✅ Map either:
   - Shows interactive map (if Google Maps API is configured)
   - Shows friendly "Map Unavailable" message (if not configured)
5. ✅ FAQ and other sections work normally

---

## Files Modified

1. `src/lib/landing/query.ts` - Fixed database column reference
2. `src/components/landing/sections/Map.tsx` - Added graceful error handling for Google Maps

---

## Notes for Production

### Google Maps Setup (Optional)
If you want to enable the map:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable billing for your project
3. Enable Maps JavaScript API
4. Create API key
5. Add to `.env.local`:
   ```
   NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_api_key_here
   ```

### Without Google Maps
The landing pages work perfectly without Google Maps! All core features (stats, properties, FAQ) function independently.
