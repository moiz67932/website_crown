# 🔧 URGENT FIX: UUID Error Resolution

## ❌ The Error You're Seeing

```
invalid input syntax for type uuid: "0"
```

## 🎯 The Problem

Your authentication system uses **numeric user IDs** (like `0`, `1`, `2`) from SQLite, but the Supabase table was created expecting **UUID user IDs** (like `9d9f1cc5-d237-4f36-b0d7-4ddb5a...`).

## ✅ The Solution

Run this SQL script in Supabase to fix the table structure.

### Step-by-Step Fix:

1. **Open Supabase Dashboard**: https://supabase.com/dashboard
2. **Go to SQL Editor** (left sidebar)
3. **Copy the contents** of `supabase-fix-user-saved-properties.sql`
4. **Paste into SQL Editor**
5. **Click "Run"**

## 📋 What the Fix Does

The fix script will:
- ✅ Remove the UUID foreign key constraint
- ✅ Convert `user_id` column from `UUID` to `TEXT`
- ✅ Update RLS policies to work with service role
- ✅ Allow both numeric IDs (`"0"`) and UUIDs

## 🧪 Test After Fix

After running the fix, test the favorites:

1. **Sign in** to your account
2. **Click a heart icon** on any property
3. **Check the terminal** - you should NOT see the UUID error anymore
4. **Heart should turn red** immediately

## 🔍 Verify the Fix Worked

Run this query in Supabase SQL Editor:

```sql
-- Check the user_id column type
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_saved_properties'
  AND column_name = 'user_id';
```

**Expected Result:**
```
column_name | data_type | is_nullable
user_id     | text      | NO
```

If you see `text` instead of `uuid`, the fix worked! ✅

## 📊 Check Your Data

After the fix, your saved favorites will be stored like this:

```sql
SELECT * FROM user_saved_properties;
```

Example row:
```
id: 123e4567-e89b-12d3-a456-426614174000
user_id: "0"  ← Notice it's a string, not UUID
listing_key: "1033813140"
property_data: {...}
is_favorite: true
```

## 🚨 If You Still Get Errors

1. **Clear browser cache** and refresh
2. **Check environment variables** are set correctly
3. **Verify user is authenticated**:
   ```javascript
   fetch('/api/auth/me').then(r => r.json()).then(console.log)
   ```
4. **Check Supabase logs** in the dashboard

## ✨ Expected Behavior After Fix

- ✅ No more UUID errors in terminal
- ✅ Heart icon turns red when clicked
- ✅ Favorites persist across page refreshes
- ✅ Alert shows when not signed in
- ✅ Data saves to Supabase successfully
