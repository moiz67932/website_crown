-- =====================================================
-- FIX EXISTING user_saved_properties TABLE
-- =====================================================
-- Run this SQL if you already created the table with UUID user_id
-- This will convert it to TEXT to support numeric user IDs from SQLite auth

-- Step 1: Drop existing RLS policies FIRST (they depend on the column)
DROP POLICY IF EXISTS "Users can view own saved properties" ON public.user_saved_properties;
DROP POLICY IF EXISTS "Users can insert own saved properties" ON public.user_saved_properties;
DROP POLICY IF EXISTS "Users can update own saved properties" ON public.user_saved_properties;
DROP POLICY IF EXISTS "Users can delete own saved properties" ON public.user_saved_properties;

-- Step 2: Drop the foreign key constraint (if it exists)
ALTER TABLE public.user_saved_properties 
  DROP CONSTRAINT IF EXISTS user_saved_properties_user_id_fkey;

-- Step 3: Change user_id column from UUID to TEXT
ALTER TABLE public.user_saved_properties 
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;

-- Step 4: Create new permissive policy for service role
CREATE POLICY "Allow service role full access" 
  ON public.user_saved_properties 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Step 5: Update comments
COMMENT ON COLUMN public.user_saved_properties.user_id IS 'User ID from custom auth system (supports both UUID and numeric IDs as TEXT)';

-- Step 6: Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_saved_properties'
  AND column_name = 'user_id';

-- Expected result: user_id should now be TEXT type
