# Favorite Properties Implementation Guide

## 🎯 Overview

This implementation provides a complete favorite properties system with:
- ✅ Authentication-required favorites (shows alert if not signed in)
- ✅ Visual feedback (red heart icon when favorited)
- ✅ Database persistence in Supabase
- ✅ Real-time state management
- ✅ Works on both Property Detail Page and Property Cards

## 📋 Prerequisites

1. **Supabase Setup**: You must have Supabase configured with environment variables
2. **Authentication**: Users must be able to sign in/register
3. **Database**: The `user_saved_properties` table must exist in Supabase

## 🗄️ Database Setup

### Step 1: Run the SQL Migration

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Open the file: `supabase-favorite-properties-migration.sql`
4. Copy the entire content and paste it into the SQL Editor
5. Click **Run** to execute the migration

This will create:
- ✅ `user_saved_properties` table with proper schema
- ✅ Indexes for performance
- ✅ Row Level Security (RLS) policies
- ✅ Auto-update trigger for timestamps

### Step 2: Verify the Table

Run this query in the SQL Editor to verify:

```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'user_saved_properties';
```

You should see one row returned with the table information.

## 🏗️ Architecture

### Files Created/Modified

#### New Files:
1. **`src/hooks/use-favorite-properties.ts`** - Custom React hook for favorites management
2. **`src/lib/supabase-saved-properties.ts`** - Supabase service for database operations
3. **`supabase-favorite-properties-migration.sql`** - Database migration script

#### Modified Files:
1. **`src/app/properties/[slug]/[id]/PropertyDetailPage.client.tsx`** - Added favorite button functionality
2. **`src/components/property-card.tsx`** - Added favorite button functionality
3. **`src/app/api/user/saved-properties/route.ts`** - Updated to use Supabase
4. **`src/app/api/user/saved-properties/[listingKey]/route.ts`** - Updated to use Supabase

### Data Flow

```
User clicks heart icon
        ↓
useFavoriteProperties hook
        ↓
Check authentication
        ↓
    ┌────────────┴────────────┐
    │ Not Authenticated       │ Authenticated
    ↓                         ↓
Show alert                Make API call
                             ↓
                    /api/user/saved-properties
                             ↓
                   SupabaseSavedPropertiesService
                             ↓
                    Supabase Database
                             ↓
                    Update local state
                             ↓
                   Visual feedback (red heart)
```

## 🔧 How It Works

### 1. Authentication Check

When a user clicks the heart icon:
- If **NOT signed in**: Shows alert "Please sign in to save favorite properties"
- If **signed in**: Proceeds to save/remove the property

### 2. Visual Feedback

The heart icon changes based on state:
- **Empty heart** (white/gray): Property not favorited
- **Filled red heart**: Property is favorited
- **Loading state**: Button is disabled while processing

### 3. Database Storage

Favorite properties are stored in Supabase with:
- User ID (from authentication)
- Property listing key
- Complete property data (JSONB)
- Favorite status (boolean)
- Notes and tags (optional)
- Timestamps

## 🧪 Testing Guide

### Test 1: Unauthenticated User

1. **Logout** if you're currently signed in
2. Navigate to any property detail page or property listing
3. Click the **heart icon**
4. **Expected**: Alert appears saying "Please sign in to save favorite properties"
5. **Verify**: No changes occur, heart remains empty

### Test 2: Authenticated User - Add Favorite

1. **Sign in** to your account
2. Navigate to a property detail page
3. Click the **heart icon**
4. **Expected**: 
   - Heart fills with red color
   - Property is saved to database
5. **Verify in Supabase**:
   ```sql
   SELECT * FROM user_saved_properties 
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC;
   ```

### Test 3: Authenticated User - Remove Favorite

1. While signed in, on a property that's already favorited (red heart)
2. Click the **red heart icon**
3. **Expected**:
   - Heart becomes empty (unfilled)
   - Property is removed from database
4. **Verify**: Heart is no longer red

### Test 4: Persistence Across Pages

1. Add a property to favorites
2. Navigate away from the page
3. Navigate back to the same property
4. **Expected**: Heart should still be red (favorited state persists)

### Test 5: Property Cards

1. Sign in
2. Go to the properties listing page
3. Click the heart icon on any property card
4. **Expected**: Same behavior as property detail page
5. Navigate to that property's detail page
6. **Expected**: Heart should already be red

### Test 6: Account Section (Future)

Once the account/profile section is implemented:
1. Sign in and favorite several properties
2. Navigate to account/favorites section
3. **Expected**: See all favorited properties listed
4. **Query to test**:
   ```sql
   SELECT property_data->>'address' as address,
          property_data->>'list_price' as price,
          is_favorite,
          created_at
   FROM user_saved_properties
   WHERE user_id = 'your-user-id'
     AND is_favorite = TRUE
   ORDER BY created_at DESC;
   ```

## 🔍 Debugging

### Check Authentication

```typescript
// In browser console on any page
const response = await fetch('/api/auth/me');
const data = await response.json();
console.log('Current user:', data);
```

### Check Saved Properties API

```typescript
// In browser console (must be signed in)
const response = await fetch('/api/user/saved-properties?favorites=true');
const data = await response.json();
console.log('Saved properties:', data);
```

### Check Supabase Connection

1. Go to Supabase Dashboard
2. Navigate to **Table Editor**
3. Select `user_saved_properties` table
4. View rows to see saved properties

## 🎨 Customization

### Change Alert Message

Edit `src/hooks/use-favorite-properties.ts`:

```typescript
// Line ~56
alert('Please sign in to save favorite properties')
// Change to your custom message
```

### Change Heart Icon Style

Edit `src/app/properties/[slug]/[id]/PropertyDetailPage.client.tsx` or `src/components/property-card.tsx`:

```typescript
// Current styling
className={`h-5 w-5 transition-all duration-300 ${
  isFavorite(propertyData.listing_key)
    ? 'fill-rose-500 text-rose-500'
    : 'group-hover:fill-current'
}`}
```

### Add Toast Notifications (Optional)

Instead of `alert()`, you can use a toast library:

```bash
npm install sonner
```

Then update the hook:

```typescript
import { toast } from 'sonner';

// Replace alert with:
toast.error('Please sign in to save favorite properties');
toast.success('Property added to favorites!');
toast.success('Property removed from favorites!');
```

## 📊 Account Section Integration

To display favorites in an account/profile page:

```typescript
// In your account page component
import { useFavoriteProperties } from '@/hooks/use-favorite-properties';

export function FavoritesPage() {
  const { favoriteProperties, isLoading } = useFavoriteProperties();
  
  // favoriteProperties is an array of listing keys
  // You can fetch full property details for each
  
  return (
    <div>
      <h1>My Favorite Properties</h1>
      {isLoading ? (
        <p>Loading...</p>
      ) : (
        <div>
          {/* Map through and display properties */}
        </div>
      )}
    </div>
  );
}
```

## 🔐 Security

The implementation includes:
- ✅ Row Level Security (RLS) in Supabase
- ✅ Users can only access their own saved properties
- ✅ Authentication required for all operations
- ✅ Server-side validation in API routes

## 🚀 Next Steps

1. ✅ Run the SQL migration in Supabase
2. ✅ Test with unauthenticated users
3. ✅ Test with authenticated users
4. ✅ Verify database persistence
5. 🔲 Create account/favorites page to display saved properties
6. 🔲 Add toast notifications (optional)
7. 🔲 Add analytics tracking for favorites (optional)

## 🐛 Common Issues

### Issue: "Supabase not configured" error

**Solution**: Verify environment variables are set:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### Issue: Alert doesn't show when not signed in

**Solution**: Check browser console for errors. Verify authentication is working:

```typescript
const response = await fetch('/api/auth/me');
console.log(await response.json());
```

### Issue: Heart doesn't turn red after clicking

**Solution**: 
1. Check browser console for API errors
2. Verify Supabase table exists
3. Check RLS policies are enabled
4. Verify user is authenticated

### Issue: Favorites don't persist across page reloads

**Solution**:
1. Check if data is being saved in Supabase
2. Verify `useFavoriteProperties` hook is loading saved properties on mount
3. Check browser console for errors

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Check the Supabase logs in the dashboard
3. Verify all environment variables are set
4. Ensure the SQL migration ran successfully
