# Landing Pages Database Connection Fix

## Overview
Connected landing pages (like `/california/san-francisco/2-bedroom-apartments`) to the database to make Market Snapshot, Featured Landing Pages, and Map fully functional.

## What Was Already Working ✅

The landing pages at `/california/[city]/[landing]` were already properly connected to the database through:

1. **Route Handler**: `src/app/california/[city]/[landing]/page.tsx`
   - Calls `getLandingData(cityName, def.slug, { landingDef: def })`
   - Fetches all necessary data from database

2. **Data Fetching**: `src/lib/landing/query.ts`
   - `getLandingStats()` - Fetches market snapshot data (median price, price per sqft, days on market, total active)
   - `getFeaturedProperties()` - Fetches featured property listings with filters
   - Properly handles city name matching with case-insensitive queries

3. **Components Already Working**:
   - **Market Snapshot** (`StatsSection`) - Displays stats from database
   - **Featured Listings** - Displays properties using `PropertyCard` component
   - **FAQ Section** - Dynamic FAQ content based on landing type
   - **Hero, Intro, AI Description** - All working

## What Was Fixed 🔧

### Map Section Enhancement
**File**: `src/components/landing/sections/Map.tsx`

**Problem**: The Map component only showed city boundaries but no property markers.

**Solution**: Added property marker functionality:
1. Added state to store fetched properties
2. Created effect to fetch properties from `/api/properties/search` API
3. Added effect to render Google Maps markers for each property
4. Each marker shows:
   - Property location on map
   - Info window with property details (price, beds, baths, sqft)
   - "View Details" link to property page
5. Added property count display in map header

**Changes Made**:
```typescript
// Added states
const markers = useRef<any[]>([]);
const [properties, setProperties] = useState<any[]>([]);

// Added property fetching
useEffect(() => {
  async function fetchProperties() {
    const searchParams = new URLSearchParams({
      city: city,
      limit: '50',
      sort: 'updated'
    });
    const response = await fetch(`/api/properties/search?${searchParams}`);
    if (response.ok) {
      const data = await response.json();
      setProperties(data.properties || []);
    }
  }
  fetchProperties();
}, [city, status]);

// Added marker rendering
useEffect(() => {
  properties.forEach((property) => {
    const marker = new g.Marker({
      position: { lat: property.latitude, lng: property.longitude },
      map: map.current,
      // ... with info window and property details
    });
  });
}, [properties]);
```

## How It Works 🔄

### URL Flow
```
/california/san-francisco/2-bedroom-apartments
                    ↓
[city]/[landing] route handler
                    ↓
getLandingData('San Francisco', '2-bedroom-apartments')
                    ↓
Parallel fetch:
- getLandingStats() → Database query for stats
- getFeaturedProperties() → Database query for listings
- getAIDescription() → AI-generated content
                    ↓
LandingTemplate component renders:
- Market Snapshot (stats)
- Featured Listings (properties)
- Map (with property markers)
```

### Database Queries

**Stats Query** (`getLandingStats`):
```sql
SELECT
  ROUND(PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY list_price)::numeric) AS median_price,
  ROUND(AVG(list_price / NULLIF(living_area,0))) AS price_per_sqft,
  ROUND(AVG(days_on_market)) AS days_on_market,
  COUNT(*) AS total_active
FROM properties
WHERE status = 'Active'
  AND LOWER(city) = LOWER($1)
  -- Plus kind-specific filters (e.g., bedrooms = 2 for 2-bedroom-apartments)
```

**Properties Query** (`getFeaturedProperties`):
```typescript
searchProperties({
  city: cityName,
  limit: 12,
  sort: 'updated',
  // Plus kind-specific filters from landingDef
})
```

### Kind-Specific Filters

Each landing type has specific filters in `buildKindFilter()`:

- `homes-for-sale`: No filters (all active homes)
- `condos-for-sale`: `property_type LIKE '%condo%'`
- `homes-with-pool`: `pool_features IS NOT NULL`
- `luxury-homes`: `list_price >= $1,000,000`
- `homes-under-500k`: `list_price <= $500,000`
- `homes-over-1m`: `list_price >= $1,000,000`
- **`2-bedroom-apartments`**: `property_type LIKE '%apartment%' AND bedrooms = 2`

## Available Landing Pages 📍

All California cities with all landing types:
- `/california/san-jose/[landing]`
- `/california/san-francisco/[landing]`

Where `[landing]` can be:
- `homes-for-sale`
- `condos-for-sale`
- `homes-with-pool`
- `luxury-homes`
- `homes-under-500k`
- `homes-over-1m`
- `2-bedroom-apartments`

## Testing 🧪

To verify the connection is working:

1. Visit `/california/san-francisco/2-bedroom-apartments`
2. Check that:
   - **Market Snapshot** section shows real data (median price, price/sqft, days on market, active listings)
   - **Featured Listings** shows property cards with real listings
   - **Map** displays city boundary AND property markers
   - Clicking property markers shows info windows
   - "View Details" links work

## Related Files 📁

- `src/app/california/[city]/[landing]/page.tsx` - Route handler
- `src/lib/landing/query.ts` - Database query logic
- `src/lib/landing/defs.ts` - Landing type definitions
- `src/components/landing/LandingTemplate.tsx` - Main template
- `src/components/landing/sections/Map.tsx` - **MODIFIED** - Map with property markers
- `src/components/landing/sections/Stats.tsx` - Market snapshot display
- `src/lib/db/property-repo.ts` - Property search function

## Future Enhancements 💡

1. Add property clustering on map for better performance with many properties
2. Add filter controls on map to filter by price range, beds, etc.
3. Add heatmap overlay for price density
4. Add property type icons on markers (house, condo, apartment)
5. Add draw tools to search within custom boundaries
6. Cache property results to reduce API calls
