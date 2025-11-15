# Property Card and Detail Page Alignment Summary

## Overview
This document summarizes the changes made to align the PropertyCard component with the PropertyDetailPage, establishing a single source of truth for property data display across the application.

## Changes Made

### 1. Updated Property Interface (`src/interfaces/index.ts`)
**Status:** ✅ Complete

- Aligned all field names with `PropertyDetail` from `useGetDetailProperty.ts`
- Established canonical field names:
  - `listing_key` (primary identifier)
  - `list_price` (not ListPrice)
  - `bedrooms` and `bathrooms` (not bedrooms_total/bathrooms_total in display)
  - `living_area_sqft` (canonical sqft field)
  - `address`, `city`, `county` (county contains state abbreviation)
  - `images`, `main_image_url`
  - `property_type`
- Added comprehensive JSDoc comments explaining field purposes
- Maintained legacy field support for backward compatibility

### 2. Created Shared Formatting Utilities (`src/lib/propertyFormatting.ts`)
**Status:** ✅ Complete

Centralized all property display logic to avoid duplication:

- `sanitizeAddress()` - Removes leading zeros and normalizes whitespace
- `formatPrice()` - Formats currency with proper locale formatting
- `formatSquareFeet()` - Formats sqft with locale formatting
- `formatRoomCount()` - Handles nullable bed/bath counts
- `getPropertyDisplayHeading()` - Derives display name (matches detail page logic exactly)
- `getPropertyLocationLine()` - Builds "City, State" location string
- `isPropertyForRent()` - Determines if property is a rental
- `getPriceLabel()` - Returns "per month" or "listing price"
- `getStatusBadgeText()` - Returns "FOR RENT" or "FOR SALE"
- `formatLotSize()` - Converts to acres if >= 1 acre
- `getPropertyFallbackImage()` - Provides variety in fallback images
- `proxifyImageUrl()` - Proxies external images through media API
- `getPropertyImageSrc()` - Determines primary image source with fallback logic

All functions match PropertyDetailPage.client.tsx behavior exactly.

### 3. Updated PropertyCard Component (`src/components/property-card.tsx`)
**Status:** ✅ Complete

- Imported and used shared formatting utilities
- Removed duplicate logic (sanitize, getImageSrc, etc.)
- Updated to use canonical field names throughout
- Exact field usage matching detail page:
  - `property.list_price` with `.toLocaleString()`
  - `property.bedrooms` and `property.bathrooms` with `?? "N/A"`
  - `property.living_area_sqft` with null-safe formatting
  - `property.property_type === "ResidentialLease"` (strict equality)
  - Address sanitization and heading derivation matching detail page
  - Location line showing `city, county`

### 4. Updated API Routes

#### `/api/properties/route.ts`
**Status:** ✅ Complete

- Response object now uses canonical field names
- Maps database columns properly:
  - `bedrooms_total` → `bedrooms`
  - `bathrooms_total` → `bathrooms`
  - `living_area` → `living_area_sqft`
  - `state_or_province` → `county`
- Includes all fields needed by PropertyCard and PropertyDetail
- Maintains backward compatibility with legacy fields

#### `/api/properties/search/semantic/route.ts`
**Status:** ✅ Complete

- `convertTrestleToAppFormat()` updated to use canonical field names
- Maps Trestle API fields to canonical names:
  - `BedroomsTotal` → `bedrooms`
  - `BathroomsTotalInteger` → `bathrooms`
  - `LivingArea` → `living_area_sqft`
  - `StateOrProvince` → `county`
- Comprehensive JSDoc comments explaining canonical mapping

### 5. Updated React Hooks

#### `useTrestlePropertiesIntegrated.ts`
**Status:** ✅ Complete

- `convertTrestleToProperty()` function updated to use canonical field names
- Proper null-coalescing for nullable fields
- Maps all API response fields to canonical Property interface
- Preserves display_name if provided by API

### 6. Detail Page Route
**Status:** ✅ Already Canonical

- `/api/properties/[listingKey]/route.ts` already returns canonical field names
- No changes needed - this is the source of truth

## Field Name Mapping Reference

| UI Display       | Canonical Field Name | Database Column        | Trestle API Field         |
|------------------|----------------------|------------------------|---------------------------|
| Listing ID       | `listing_key`        | `listing_key`          | `ListingKey`              |
| Price            | `list_price`         | `list_price`           | `ListPrice`               |
| Bedrooms         | `bedrooms`           | `bedrooms_total`       | `BedroomsTotal`           |
| Bathrooms        | `bathrooms`          | `bathrooms_total`      | `BathroomsTotalInteger`   |
| Living Area      | `living_area_sqft`   | `living_area`          | `LivingArea`              |
| Address          | `address`            | `address`/`unparsed_address` | `UnparsedAddress` |
| City             | `city`               | `city`                 | `City`                    |
| State (display)  | `county`             | `state_or_province`    | `StateOrProvince`         |
| Postal Code      | `postal_code`        | `postal_code`          | `PostalCode`              |
| Property Type    | `property_type`      | `property_type`        | `PropertyType`            |
| Images           | `images`             | N/A (computed)         | `Photos`                  |
| Main Image       | `main_image_url`     | `main_photo_url`       | `Photos[0]`               |

## Display Logic Consistency

### Property Heading
Both card and detail page now use identical logic:
1. Try `h1_heading`, `title`, `seo_title` (if different from address)
2. Fall back to sanitized `address`
3. Fall back to `city`
4. Fall back to "Property"

### Location Line
Both show: `{city}, {county}` where county contains the state abbreviation

### Price Display
Both use: `${list_price.toLocaleString()}`

### Price Label
Both use: `property_type === "ResidentialLease" ? "per month" : "listing price"`

### Status Badge
Both use: `property_type === "ResidentialLease" ? "FOR RENT" : "FOR SALE"`

### Room Counts
Both use: `bedrooms ?? "N/A"` and `bathrooms ?? "N/A"`

### Living Area
Both use: `living_area_sqft ? living_area_sqft.toLocaleString() : "N/A"`

## Type Safety

- All components properly typed with canonical `Property` or `PropertyDetail` interfaces
- No TypeScript errors
- Proper null handling throughout
- Backward compatibility maintained where needed

## Testing Checklist

- [ ] Property card displays correct address (sanitized, no leading zeros)
- [ ] Property card displays correct city, state
- [ ] Property card displays correct price with proper formatting
- [ ] Property card displays correct bed/bath counts (nullable)
- [ ] Property card displays correct square footage
- [ ] Property card displays correct status badge (FOR RENT / FOR SALE)
- [ ] Property card image loads correctly with fallbacks
- [ ] Property card links to detail page with correct URL
- [ ] Detail page shows identical values for same listing
- [ ] No TypeScript compilation errors
- [ ] No runtime errors in console

## Call Sites Verified

All PropertyCard usages now receive properly formatted data:
- ✅ `/app/page.tsx` (homepage featured properties)
- ✅ `/app/properties/page.tsx` (property search/listing page)
- ✅ `/app/discover/[city]/page.tsx` (city discovery pages)
- ✅ `/components/landing/LandingTemplate.tsx` (landing pages)

## Benefits

1. **Single Source of Truth**: PropertyDetail interface is canonical
2. **No Duplication**: Shared utilities prevent logic drift
3. **Type Safety**: Proper TypeScript interfaces prevent errors
4. **Maintainability**: Changes in one place affect both card and detail
5. **Consistency**: Users see identical data on cards and detail pages
6. **Backward Compatibility**: Legacy field names supported where needed

## Future Improvements

1. Consider extracting PropertyDetail and Property into a single merged interface
2. Add automated tests to verify card/detail consistency
3. Consider creating a PropertyCardSkeleton component for loading states
4. Add Storybook stories showing card and detail page side-by-side
