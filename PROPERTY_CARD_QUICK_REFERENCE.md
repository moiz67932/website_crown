# Property Card Alignment - Quick Reference

## What Changed?

### Files Modified

1. **`src/interfaces/index.ts`** - Property interface updated to match PropertyDetail
2. **`src/lib/propertyFormatting.ts`** - NEW shared utilities file
3. **`src/components/property-card.tsx`** - Updated to use canonical fields and shared utilities
4. **`src/app/api/properties/route.ts`** - Response mapping updated to canonical fields
5. **`src/app/api/properties/search/semantic/route.ts`** - Trestle conversion updated
6. **`src/hooks/useTrestlePropertiesIntegrated.ts`** - Property conversion updated

### Key Changes Summary

#### Before → After

**Bedrooms/Bathrooms Display:**
```tsx
// BEFORE (inconsistent nullish coalescing)
{property.bedrooms ?? 0}

// AFTER (matches detail page)
{formatRoomCount(property.bedrooms)}  // Returns "N/A" if null
```

**Living Area Display:**
```tsx
// BEFORE (complex type checking)
{property.living_area_sqft
  ? (typeof property.living_area_sqft === 'number' 
      ? property.living_area_sqft 
      : parseFloat(property.living_area_sqft)).toLocaleString()
  : "N/A"}

// AFTER (simple shared utility)
{formatSquareFeet(property.living_area_sqft)}
```

**Address/Heading Logic:**
```tsx
// BEFORE (simple fallback)
const mainHeading = sanitizedAddress || property.city || 'Property';

// AFTER (matches detail page exactly)
const displayHeading = getPropertyDisplayHeading(property);
// Tries h1_heading, title, seo_title, then address, city, "Property"
```

**Location Line:**
```tsx
// BEFORE (used state or county)
{property.city}, {property.state || property.county}

// AFTER (always uses county which contains state)
{getPropertyLocationLine(property)}  // Returns "City, County"
```

**Status Badge:**
```tsx
// BEFORE (loose equality)
property.property_type == "ResidentialLease" ? "FOR RENT" : "FOR SALE"

// AFTER (strict equality via utility)
{getStatusBadgeText(property.property_type)}
```

**Image Source:**
```tsx
// BEFORE (inline complex logic)
const getImageSrc = () => {
  const fallback = getPropertyFallbackImage(...);
  if (imageError) return fallback;
  if (property.listing_key) return `/api/media?listingKey=...`;
  // ... many more lines
};

// AFTER (shared utility)
const imageSrc = getPropertyImageSrc(property, imageError);
```

## Canonical Field Names

Use these field names throughout the codebase:

| Field Purpose | Use This | NOT This |
|---------------|----------|----------|
| Primary ID | `listing_key` | `ListingKey`, `id` only |
| Price | `list_price` | `ListPrice`, `price` |
| Beds | `bedrooms` | `BedroomsTotal`, `bedrooms_total` |
| Baths | `bathrooms` | `BathroomsTotalInteger`, `bathrooms_total` |
| Sqft | `living_area_sqft` | `LivingArea`, `living_area` |
| Address | `address` | `UnparsedAddress`, `full_address` |
| State | `county` | `state`, `StateOrProvince` |
| Images | `images`, `main_image_url` | `Photos`, `main_photo_url` |

## Shared Utilities Available

Import from `@/lib/propertyFormatting`:

- `getPropertyDisplayHeading(property)` - Smart heading derivation
- `getPropertyLocationLine(property)` - "City, State" format
- `formatPrice(price)` - "$XXX,XXX"
- `formatSquareFeet(sqft)` - "X,XXX" or "N/A"
- `formatRoomCount(count)` - Number or "N/A"
- `getStatusBadgeText(propertyType)` - "FOR RENT" / "FOR SALE"
- `getPriceLabel(propertyType)` - "per month" / "listing price"
- `isPropertyForRent(propertyType)` - Boolean
- `getPropertyImageSrc(property, imageError)` - Primary image URL
- `proxifyImageUrl(url)` - Proxy external images
- `sanitizeAddress(address)` - Remove leading zeros, normalize whitespace

## Testing Quick Start

1. **Run dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser to:**
   - Homepage: http://localhost:3000
   - Properties: http://localhost:3000/properties
   - Detail page: http://localhost:3000/properties/[address-slug]/[listing_key]

3. **Check console for errors:**
   - Press F12 to open DevTools
   - Check Console tab for errors
   - Check Network tab for API responses

4. **Verify a property:**
   - Note the listing_key from a card (visible in link or data)
   - Click the card to go to detail page
   - Compare: address, city/state, price, beds, baths, sqft
   - All should match exactly

## Common Issues & Solutions

### Issue: "Cannot read property X of undefined"
**Solution:** Check that API is returning the canonical field name. Update API mapping if needed.

### Issue: Beds/Baths showing "0" instead of "N/A"
**Solution:** Use `formatRoomCount()` utility instead of direct nullish coalescing with `0`.

### Issue: Address showing "0 0 123 Main St"
**Solution:** API should use `sanitizeAddress()` when returning address data.

### Issue: State showing full name instead of abbreviation
**Solution:** Use `county` field (which contains state abbreviation), not `state`.

### Issue: Different heading on card vs detail
**Solution:** Both should use `getPropertyDisplayHeading()` for consistency.

### Issue: TypeScript errors about missing fields
**Solution:** Update Property interface in `src/interfaces/index.ts` to include missing fields.

## Rollback Plan

If issues arise, these files can be reverted:

```bash
# Git rollback commands (adjust commit hash as needed)
git checkout HEAD~1 src/components/property-card.tsx
git checkout HEAD~1 src/interfaces/index.ts
git checkout HEAD~1 src/app/api/properties/route.ts
```

Then rebuild:
```bash
npm run build
```

## Future Maintenance

When adding new property display features:

1. Add the field to `Property` interface in `src/interfaces/index.ts`
2. Add the field to `PropertyDetail` if needed (usually they match)
3. Update API responses to include the field
4. Add a formatting utility to `src/lib/propertyFormatting.ts` if complex logic needed
5. Use the same utility in both PropertyCard and PropertyDetailPage

This ensures continued consistency across all property displays.
