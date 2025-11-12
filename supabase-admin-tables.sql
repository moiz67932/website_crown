-- Admin Dashboard - Required Database Tables
-- Run this SQL in your Supabase SQL Editor to create the necessary tables

-- =====================================================
-- 1. Landing Pages Table
-- =====================================================
CREATE TABLE IF NOT EXISTS landing_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  page_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  meta_title TEXT,
  meta_description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  property_count INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
DO $$ 
BEGIN
  -- Add state column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'state'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN state TEXT;
  END IF;
  
  -- Add slug column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'slug'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN slug TEXT UNIQUE;
  END IF;
  
  -- Add page_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'page_type'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN page_type TEXT;
  END IF;
  
  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'title'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN title TEXT;
  END IF;
  
  -- Add description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'description'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN description TEXT;
  END IF;
  
  -- Add content column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'content'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN content TEXT;
  END IF;
  
  -- Add meta_title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'meta_title'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN meta_title TEXT;
  END IF;
  
  -- Add meta_description column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'meta_description'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN meta_description TEXT;
  END IF;
  
  -- Add status column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'status'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published'));
  END IF;
  
  -- Add property_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'property_count'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN property_count INTEGER DEFAULT 0;
  END IF;
  
  -- Add views column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'views'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN views INTEGER DEFAULT 0;
  END IF;
  
  -- Add page_name column (from existing schema)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'page_name'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN page_name TEXT;
  END IF;
  
  -- Add kind column (from existing schema)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landing_pages' AND column_name = 'kind'
  ) THEN
    ALTER TABLE landing_pages ADD COLUMN kind TEXT;
  END IF;
END $$;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_landing_pages_city ON landing_pages(city);
CREATE INDEX IF NOT EXISTS idx_landing_pages_state ON landing_pages(state);
CREATE INDEX IF NOT EXISTS idx_landing_pages_slug ON landing_pages(slug);
CREATE INDEX IF NOT EXISTS idx_landing_pages_page_type ON landing_pages(page_type);
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);

-- RLS Policies (if needed)
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Allow public to read published pages
CREATE POLICY "Public can view published landing pages"
ON landing_pages FOR SELECT
USING (status = 'published');

-- Allow authenticated users to manage landing pages
CREATE POLICY "Authenticated users can manage landing pages"
ON landing_pages FOR ALL
USING (auth.role() = 'authenticated');

-- =====================================================
-- 2. Admin Settings Table
-- =====================================================
CREATE TABLE IF NOT EXISTS admin_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  -- General Settings
  site_name TEXT DEFAULT 'Crown Coastal Realty',
  site_description TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- API Settings
  trestle_api_key TEXT,
  trestle_api_url TEXT,
  openai_api_key TEXT,
  google_maps_api_key TEXT,
  
  -- SEO Settings
  default_meta_title TEXT,
  default_meta_description TEXT,
  google_analytics_id TEXT,
  google_search_console TEXT,
  
  -- Email Settings
  email_provider TEXT,
  email_from TEXT,
  email_notifications BOOLEAN DEFAULT true,
  
  -- Automation Settings
  auto_sync_properties BOOLEAN DEFAULT true,
  sync_interval TEXT DEFAULT 'daily',
  auto_blog_generation BOOLEAN DEFAULT true,
  blog_posts_per_week INTEGER DEFAULT 7,
  
  -- Security Settings
  two_factor_auth BOOLEAN DEFAULT false,
  password_expiry TEXT DEFAULT '90',
  session_timeout TEXT DEFAULT '60',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one settings row
  CONSTRAINT single_row_check CHECK (id = 1)
);

-- RLS for admin settings
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can read/write settings
CREATE POLICY "Authenticated users can manage settings"
ON admin_settings FOR ALL
USING (auth.role() = 'authenticated');

-- Insert default settings
INSERT INTO admin_settings (id) VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 3. SEO Metrics Table (Optional - for tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS seo_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  page_title TEXT,
  meta_description TEXT,
  keywords TEXT[],
  google_rank INTEGER,
  page_views INTEGER DEFAULT 0,
  avg_time_on_page INTEGER DEFAULT 0,
  bounce_rate INTEGER DEFAULT 0,
  indexed BOOLEAN DEFAULT false,
  sitemap_included BOOLEAN DEFAULT true,
  schema_markup BOOLEAN DEFAULT false,
  mobile_friendly BOOLEAN DEFAULT true,
  page_speed_score INTEGER DEFAULT 0,
  issues TEXT[],
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_seo_metrics_page_url ON seo_metrics(page_url);
CREATE INDEX IF NOT EXISTS idx_seo_metrics_last_checked ON seo_metrics(last_checked);

-- RLS for SEO metrics
ALTER TABLE seo_metrics ENABLE ROW LEVEL SECURITY;

-- Only authenticated users can manage SEO metrics
CREATE POLICY "Authenticated users can manage SEO metrics"
ON seo_metrics FOR ALL
USING (auth.role() = 'authenticated');

-- =====================================================
-- 4. Update Triggers for updated_at
-- =====================================================

-- Landing pages trigger
CREATE OR REPLACE FUNCTION update_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER landing_pages_updated_at
BEFORE UPDATE ON landing_pages
FOR EACH ROW
EXECUTE FUNCTION update_landing_pages_updated_at();

-- Admin settings trigger
CREATE OR REPLACE FUNCTION update_admin_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_settings_updated_at
BEFORE UPDATE ON admin_settings
FOR EACH ROW
EXECUTE FUNCTION update_admin_settings_updated_at();

-- SEO metrics trigger
CREATE OR REPLACE FUNCTION update_seo_metrics_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER seo_metrics_updated_at
BEFORE UPDATE ON seo_metrics
FOR EACH ROW
EXECUTE FUNCTION update_seo_metrics_updated_at();

-- =====================================================
-- 5. Sample Data (Optional)
-- =====================================================

-- Insert sample landing pages for testing (only if slug column exists and has values)
-- First, generate slugs from page_name if slug is empty
DO $$ 
BEGIN
  -- Update existing records to have page_name from slug or page_type
  UPDATE landing_pages 
  SET page_name = COALESCE(page_name, page_type, substring(slug from '[^/]+$'))
  WHERE page_name IS NULL OR page_name = '';
  
  -- Update existing records to have kind from page_type or page_name
  UPDATE landing_pages 
  SET kind = COALESCE(kind, page_type, page_name)
  WHERE kind IS NULL OR kind = '';
  
  -- Update existing records to have slugs based on city and page_name
  UPDATE landing_pages 
  SET slug = '/' || lower(city) || '/' || lower(replace(COALESCE(page_name, page_type, 'page'), ' ', '-'))
  WHERE slug IS NULL OR slug = '';
  
  -- Set default state for existing records
  UPDATE landing_pages 
  SET state = 'CA'
  WHERE state IS NULL OR state = '';
  
  -- Set default page_type for existing records
  UPDATE landing_pages 
  SET page_type = COALESCE(page_type, kind, 'general')
  WHERE page_type IS NULL OR page_type = '';
  
  -- Set default title from page_name if not present
  UPDATE landing_pages 
  SET title = city || ' ' || COALESCE(page_name, page_type, 'Page')
  WHERE title IS NULL OR title = '';
  
  -- Set default status
  UPDATE landing_pages 
  SET status = 'published'
  WHERE status IS NULL OR status = '';
END $$;

-- Insert sample landing pages for testing (if they don't exist)
-- Note: 'page_name' and 'kind' columns are from the existing schema
INSERT INTO landing_pages (city, state, slug, page_type, title, description, status, page_name, kind)
VALUES 
  ('Orange', 'CA', '/orange/homes-for-sale', 'homes-for-sale', 'Homes for Sale in Orange, CA', 'Find your dream home in Orange, California', 'published', 'homes-for-sale', 'homes-for-sale'),
  ('Irvine', 'CA', '/irvine/luxury-homes', 'luxury-homes', 'Luxury Homes in Irvine, CA', 'Discover luxury living in Irvine', 'published', 'luxury-homes', 'luxury-homes'),
  ('Newport Beach', 'CA', '/newport-beach/condos-for-sale', 'condos-for-sale', 'Condos for Sale in Newport Beach', 'Beachfront condos in Newport Beach', 'published', 'condos-for-sale', 'condos-for-sale')
ON CONFLICT (slug) DO NOTHING;

-- =====================================================
-- 6. Useful Queries
-- =====================================================

-- Count landing pages by status
-- SELECT status, COUNT(*) FROM landing_pages GROUP BY status;

-- Get most viewed landing pages
-- SELECT city, title, views FROM landing_pages ORDER BY views DESC LIMIT 10;

-- Get landing pages by city
-- SELECT * FROM landing_pages WHERE city = 'Orange' ORDER BY page_type;

-- Get SEO issues
-- SELECT page_url, issues FROM seo_metrics WHERE array_length(issues, 1) > 0;

-- =====================================================
-- Notes:
-- =====================================================
-- 1. Run this script in Supabase SQL Editor
-- 2. Make sure to enable RLS on your tables
-- 3. Adjust policies based on your authentication setup
-- 4. Consider adding more indexes for performance
-- 5. Update API keys in admin_settings after table creation


-- UPDATE admin_settings
-- SET 
--   -- API Keys (keep these secret!)
--   trestle_api_key = 'your-trestle-api-key-here',
--   trestle_api_url = 'https://api.trestle.com/v1',
--   openai_api_key = 'sk-your-openai-key-here',
--   google_maps_api_key = 'your-google-maps-key',
  
--   -- Contact Info
--   contact_email = 'info@crowncoastalrealty.com',
--   contact_phone = '(949) 555-1234',
  
--   -- SEO
--   google_analytics_id = 'G-XXXXXXXXXX',
  
--   -- Email
--   email_from = 'noreply@crowncoastalrealty.com'
-- WHERE id = 1;