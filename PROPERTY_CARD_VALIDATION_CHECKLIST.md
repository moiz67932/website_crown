# Property Card Alignment - Validation Checklist

## Pre-Deployment Validation

Use this checklist to verify that the PropertyCard and PropertyDetailPage are displaying identical data.

### Test Property Information
- Test Listing ID: `1114717669` (or any known listing_key from your database)

### Visual Validation Steps

#### 1. Address Display
- [ ] **Property Card**: Address shows without leading zeros (e.g., "123 Main St" not "0 0 123 Main St")
- [ ] **Detail Page**: Same address format (sanitized, no leading zeros)
- [ ] **Match**: ✓ / ✗

#### 2. Location Line
- [ ] **Property Card**: Shows "City, State" format (e.g., "Lancaster, CA")
- [ ] **Detail Page**: Shows "City, State" format (e.g., "Lancaster, CA")
- [ ] **Match**: ✓ / ✗

#### 3. Price Display
- [ ] **Property Card**: Shows formatted price (e.g., "$450,000")
- [ ] **Detail Page**: Shows same formatted price (e.g., "$450,000")
- [ ] **Match**: ✓ / ✗

#### 4. Price Label
- [ ] **Property Card**: For rentals shows "per month", for sale shows "listing price"
- [ ] **Detail Page**: Same label logic
- [ ] **Match**: ✓ / ✗

#### 5. Bedrooms Count
- [ ] **Property Card**: Shows correct number or "N/A" if null
- [ ] **Detail Page**: Shows same number or "N/A"
- [ ] **Match**: ✓ / ✗

#### 6. Bathrooms Count
- [ ] **Property Card**: Shows correct number or "N/A" if null
- [ ] **Detail Page**: Shows same number or "N/A"
- [ ] **Match**: ✓ / ✗

#### 7. Living Area (Square Footage)
- [ ] **Property Card**: Shows formatted sqft (e.g., "2,500") or "N/A"
- [ ] **Detail Page**: Shows same formatted sqft or "N/A"
- [ ] **Match**: ✓ / ✗

#### 8. Status Badge
- [ ] **Property Card**: Shows "FOR RENT" or "FOR SALE" based on property_type
- [ ] **Detail Page**: Shows same status badge
- [ ] **Match**: ✓ / ✗

#### 9. Property Type Display
- [ ] **Property Card**: Shows property_type (e.g., "Residential")
- [ ] **Detail Page**: Shows same property_type
- [ ] **Match**: ✓ / ✗

#### 10. Property Heading
- [ ] **Property Card**: Shows h1_heading, title, or seo_title if available and different from address
- [ ] **Detail Page**: Shows same heading logic
- [ ] **Match**: ✓ / ✗

### Navigation Test
- [ ] **Link URL**: PropertyCard links to `/properties/{slug}/{listing_key}`
- [ ] **Clickable**: Card is clickable and navigates to detail page
- [ ] **Correct Property**: Detail page loads the same property shown on card

### Data Consistency Tests

#### API Response Check
Open browser dev tools → Network tab:

1. **Search/List API** (`/api/properties`)
   - [ ] Response includes canonical fields: `listing_key`, `list_price`, `bedrooms`, `bathrooms`, `living_area_sqft`
   - [ ] `county` field contains state abbreviation
   - [ ] No undefined/null for required fields

2. **Detail API** (`/api/properties/{listingKey}`)
   - [ ] Same canonical fields present
   - [ ] Values match list API for same property
   - [ ] Images array populated

#### Console Check
- [ ] No TypeScript errors in terminal
- [ ] No runtime errors in browser console
- [ ] No "Cannot read property of undefined" errors
- [ ] No "X is not a function" errors

### Cross-Page Consistency Test

For the same property (use listing_key to identify):

| Field | Card Value | Detail Value | Match? |
|-------|------------|--------------|--------|
| Address | _________ | _________ | ☐ |
| City, State | _________ | _________ | ☐ |
| Price | _________ | _________ | ☐ |
| Bedrooms | _________ | _________ | ☐ |
| Bathrooms | _________ | _________ | ☐ |
| Sq Ft | _________ | _________ | ☐ |
| Status | _________ | _________ | ☐ |

### Edge Cases

Test these scenarios:

#### Null/Missing Data
- [ ] Property with null bedrooms displays "N/A" on both card and detail
- [ ] Property with null bathrooms displays "N/A" on both card and detail
- [ ] Property with null living_area_sqft displays "N/A" on both card and detail

#### Address Formatting
- [ ] Address with leading zeros is sanitized (e.g., "0 0 123" → "123")
- [ ] Address with extra whitespace is normalized
- [ ] Missing address falls back to city name

#### Rental vs Sale
- [ ] ResidentialLease shows "FOR RENT" and "per month"
- [ ] Other types show "FOR SALE" and "listing price"

#### Image Fallbacks
- [ ] Missing images show appropriate fallback image
- [ ] Failed image loads trigger fallback
- [ ] Fallback varies by property type and price

### Responsive Design Check
- [ ] Card displays correctly on mobile (320px width)
- [ ] Card displays correctly on tablet (768px width)
- [ ] Card displays correctly on desktop (1920px width)
- [ ] All text is readable at all sizes
- [ ] Images load and scale properly

### Performance Check
- [ ] Cards load without visible lag
- [ ] Images load progressively
- [ ] No layout shift when images load
- [ ] Hover effects are smooth (60fps)

### Accessibility Check
- [ ] Card has proper semantic HTML
- [ ] Link has accessible label
- [ ] Images have alt text
- [ ] Focus states are visible
- [ ] Keyboard navigation works

## Sign-Off

- [ ] All checks passed
- [ ] Edge cases handled
- [ ] No console errors
- [ ] Cross-browser tested (Chrome, Firefox, Safari)
- [ ] Mobile tested on real device
- [ ] Ready for production

**Tester Name:** ________________

**Date:** ________________

**Notes:**
_______________________________________
_______________________________________
_______________________________________
