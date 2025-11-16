-- =====================================================
-- FAVORITE PROPERTIES TABLE SETUP FOR SUPABASE
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to create the user_saved_properties table
-- This table stores favorite/saved properties for authenticated users

-- Drop existing table if needed (WARNING: This will delete all data)
-- DROP TABLE IF EXISTS public.user_saved_properties CASCADE;

-- Create the user_saved_properties table if it doesn't exist
-- Using TEXT for user_id to support both UUID and numeric IDs from different auth systems
CREATE TABLE IF NOT EXISTS public.user_saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Changed from UUID to TEXT to support both UUID and numeric user IDs
  property_id TEXT NOT NULL,
  listing_key TEXT NOT NULL,
  property_data JSONB NOT NULL,
  notes TEXT,
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_user_property UNIQUE (user_id, listing_key)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_saved_properties_user_id 
  ON public.user_saved_properties(user_id);

CREATE INDEX IF NOT EXISTS idx_user_saved_properties_listing_key 
  ON public.user_saved_properties(listing_key);

CREATE INDEX IF NOT EXISTS idx_user_saved_properties_is_favorite 
  ON public.user_saved_properties(is_favorite) 
  WHERE is_favorite = TRUE;

CREATE INDEX IF NOT EXISTS idx_user_saved_properties_created_at 
  ON public.user_saved_properties(created_at DESC);

-- Create Row Level Security (RLS) policies
-- NOTE: Since we're using custom auth (not Supabase auth), we'll make policies more permissive
-- and rely on API-level authentication
ALTER TABLE public.user_saved_properties ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own saved properties" ON public.user_saved_properties;
DROP POLICY IF EXISTS "Users can insert own saved properties" ON public.user_saved_properties;
DROP POLICY IF EXISTS "Users can update own saved properties" ON public.user_saved_properties;
DROP POLICY IF EXISTS "Users can delete own saved properties" ON public.user_saved_properties;

-- Create permissive policies for service role access
-- The API will handle authentication, RLS allows service role to access all data
CREATE POLICY "Allow service role full access" 
  ON public.user_saved_properties 
  FOR ALL 
  USING (true)
  WITH CHECK (true);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_saved_properties_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the update function
DROP TRIGGER IF EXISTS trigger_update_saved_properties_updated_at ON public.user_saved_properties;
CREATE TRIGGER trigger_update_saved_properties_updated_at
  BEFORE UPDATE ON public.user_saved_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_saved_properties_updated_at();

-- Optional: Add comments for documentation
COMMENT ON TABLE public.user_saved_properties IS 'Stores favorite and saved properties for users';
COMMENT ON COLUMN public.user_saved_properties.user_id IS 'User ID from custom auth system (supports both UUID and numeric IDs as TEXT)';
COMMENT ON COLUMN public.user_saved_properties.property_id IS 'Internal property identifier';
COMMENT ON COLUMN public.user_saved_properties.listing_key IS 'MLS listing key for the property';
COMMENT ON COLUMN public.user_saved_properties.property_data IS 'Complete property object stored as JSONB';
COMMENT ON COLUMN public.user_saved_properties.notes IS 'User notes about the property';
COMMENT ON COLUMN public.user_saved_properties.tags IS 'Array of user-defined tags for categorization';
COMMENT ON COLUMN public.user_saved_properties.is_favorite IS 'Whether this property is marked as a favorite';

-- =====================================================
-- MIGRATION NOTE
-- =====================================================
-- If the table already exists with UUID user_id, run this to migrate:
-- 
-- ALTER TABLE public.user_saved_properties DROP CONSTRAINT IF EXISTS user_saved_properties_user_id_fkey;
-- ALTER TABLE public.user_saved_properties ALTER COLUMN user_id TYPE TEXT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- After running the above SQL, you can verify the table was created correctly:

-- Check if the table exists
SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name = 'user_saved_properties';

-- Check the table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'user_saved_properties'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'user_saved_properties';

-- =====================================================
-- SAMPLE QUERIES FOR TESTING
-- =====================================================

-- Get all saved properties for a user (replace 'user-uuid-here' with actual user ID)
-- SELECT * FROM user_saved_properties 
-- WHERE user_id = 'user-uuid-here' 
-- ORDER BY created_at DESC;

-- Get only favorite properties for a user
-- SELECT * FROM user_saved_properties 
-- WHERE user_id = 'user-uuid-here' 
--   AND is_favorite = TRUE 
-- ORDER BY created_at DESC;

-- Count saved properties by user
-- SELECT user_id, 
--        COUNT(*) as total_saved,
--        COUNT(*) FILTER (WHERE is_favorite = TRUE) as total_favorites
-- FROM user_saved_properties
-- GROUP BY user_id;
