# ✅ Favorite Properties - Quick Setup Guide

## 🚀 Quick Start (3 Steps)

### Step 1: Run SQL Migration in Supabase

**IMPORTANT: If you already ran the previous migration, run the fix script first!**

#### Option A: Fresh Installation
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy and paste content from `supabase-favorite-properties-migration.sql`
4. Click **Run**

#### Option B: Fix Existing Table (If you get UUID error)
1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Go to **SQL Editor**
3. Copy and paste content from `supabase-fix-user-saved-properties.sql`
4. Click **Run**
5. This will convert the `user_id` column from UUID to TEXT to support numeric user IDs

### Step 2: Verify Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 3: Test the Implementation

**Test without login:**
1. Logout (if signed in)
2. Click any heart icon
3. Should see: "Please sign in to save favorite properties"

**Test with login:**
1. Sign in to your account
2. Click any heart icon
3. Heart should turn **red**
4. Refresh page - heart should stay red
5. Click red heart - should turn back to empty

## 📁 What Was Created/Modified

### New Files:
- ✅ `src/hooks/use-favorite-properties.ts` - Favorites hook with auth check
- ✅ `src/lib/supabase-saved-properties.ts` - Supabase service
- ✅ `supabase-favorite-properties-migration.sql` - Database setup
- ✅ `FAVORITE_PROPERTIES_IMPLEMENTATION.md` - Full documentation

### Modified Files:
- ✅ `src/app/properties/[slug]/[id]/PropertyDetailPage.client.tsx` - Added favorite functionality
- ✅ `src/components/property-card.tsx` - Added favorite functionality
- ✅ `src/app/api/user/saved-properties/route.ts` - Uses Supabase now
- ✅ `src/app/api/user/saved-properties/[listingKey]/route.ts` - Uses Supabase now

## 🎯 Features Implemented

✅ **Authentication Check** - Shows alert if not signed in  
✅ **Visual Feedback** - Red filled heart when favorited  
✅ **Database Storage** - Saves to Supabase `user_saved_properties` table  
✅ **Persistence** - Favorites persist across page refreshes  
✅ **Works on Property Cards** - Favorite from listing pages  
✅ **Works on Property Detail** - Favorite from detail pages  
✅ **Row Level Security** - Only you can see your favorites  

## 🔍 Verify Database Setup

Run this in Supabase SQL Editor:

```sql
-- Check table exists
SELECT * FROM user_saved_properties LIMIT 1;

-- Check your favorites (replace with your user ID)
SELECT 
  property_data->>'address' as address,
  property_data->>'list_price' as price,
  is_favorite,
  created_at
FROM user_saved_properties
WHERE user_id = auth.uid()
ORDER BY created_at DESC;
```

## 🎨 How Heart Button Works

### Not Signed In:
```
Click Heart → Shows Alert → No Changes
```

### Signed In:
```
Click Empty Heart → Saves to DB → Heart Turns Red
Click Red Heart → Removes from DB → Heart Becomes Empty
```

## 📱 Where to Find Account/Favorites Page

The account section where users can view all their favorites needs to be implemented separately. Here's a sample implementation you can add:

**Create: `src/app/account/favorites/page.tsx`**

```typescript
"use client"

import { useFavoriteProperties } from '@/hooks/use-favorite-properties'

export default function FavoritesPage() {
  const { favoriteProperties, isLoading } = useFavoriteProperties()
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">My Favorite Properties</h1>
      
      {isLoading ? (
        <p>Loading favorites...</p>
      ) : favoriteProperties.length === 0 ? (
        <p>No favorites yet. Start browsing properties!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Display favorite properties here */}
          {favoriteProperties.map(listingKey => (
            <div key={listingKey}>Property: {listingKey}</div>
          ))}
        </div>
      )}
    </div>
  )
}
```

## 🐛 Troubleshooting

**Error: "invalid input syntax for type uuid"?**
- Your auth system uses numeric user IDs (like "0"), not UUIDs
- **Solution**: Run `supabase-fix-user-saved-properties.sql` in Supabase SQL Editor
- This converts the `user_id` column from UUID to TEXT

**Heart doesn't turn red?**
- Check browser console for errors
- Verify you're signed in: `fetch('/api/auth/me').then(r => r.json())`
- Check Supabase table was created

**Alert doesn't show?**
- Make sure you're logged out
- Check browser console for JavaScript errors

**Data not persisting?**
- Verify SQL migration ran successfully
- Check RLS policies are enabled
- Test with this query in Supabase:
  ```sql
  SELECT * FROM user_saved_properties;
  ```

## 📚 Full Documentation

See `FAVORITE_PROPERTIES_IMPLEMENTATION.md` for:
- Detailed architecture explanation
- Complete testing guide
- Customization options
- Security details
- API reference

## ✨ Next Steps

1. ✅ Run SQL migration
2. ✅ Test with logged out user
3. ✅ Test with logged in user
4. 🔲 Create favorites page in account section
5. 🔲 Add count badge showing number of favorites
6. 🔲 Add "Remove from favorites" button on favorites page
