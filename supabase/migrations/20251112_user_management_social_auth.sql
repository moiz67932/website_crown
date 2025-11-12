-- User Management & Social Authentication Migration
-- This migration adds social login support and enhances user management features

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS user_social_connections CASCADE;
DROP TABLE IF EXISTS user_viewed_properties CASCADE;
DROP TABLE IF EXISTS user_search_history CASCADE;
DROP TABLE IF EXISTS user_saved_searches CASCADE;
DROP TABLE IF EXISTS user_saved_properties CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE, -- references auth.users(id)
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  bio TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{
    "email_alerts": true,
    "sms_alerts": false,
    "push_notifications": true,
    "weekly_digest": true,
    "property_updates": true,
    "price_changes": true,
    "new_listings": true
  }',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_social_connections table
CREATE TABLE user_social_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'google', 'facebook', 'apple', etc.
  provider_id TEXT NOT NULL, -- The ID from the social provider
  provider_email TEXT,
  provider_name TEXT,
  provider_avatar_url TEXT,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  raw_user_meta_data JSONB,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(provider, provider_id)
);

-- Create user_saved_properties table
CREATE TABLE user_saved_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  property_id TEXT NOT NULL, -- Internal property ID
  listing_key TEXT NOT NULL, -- MLS Listing Key
  property_data JSONB NOT NULL, -- Full property object
  notes TEXT,
  tags TEXT[], -- Array of tags
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_key)
);

-- Create user_saved_searches table
CREATE TABLE user_saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  search_name TEXT NOT NULL,
  search_criteria JSONB NOT NULL, -- Stores all search filters
  alert_frequency TEXT DEFAULT 'daily', -- 'instant', 'daily', 'weekly', 'never'
  is_active BOOLEAN DEFAULT TRUE,
  last_alerted_at TIMESTAMPTZ,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_search_history table
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  search_query TEXT,
  search_criteria JSONB, -- Filters used
  results_count INTEGER,
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create user_viewed_properties table
CREATE TABLE user_viewed_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  property_id TEXT NOT NULL,
  listing_key TEXT NOT NULL,
  property_data JSONB NOT NULL,
  view_duration INTEGER, -- Seconds spent viewing
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, listing_key, viewed_at) -- Allow multiple views, track with timestamp
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_social_connections_user_id ON user_social_connections(user_id);
CREATE INDEX idx_social_connections_provider ON user_social_connections(provider, provider_id);
CREATE INDEX idx_saved_properties_user_id ON user_saved_properties(user_id);
CREATE INDEX idx_saved_properties_listing_key ON user_saved_properties(listing_key);
CREATE INDEX idx_saved_properties_favorite ON user_saved_properties(user_id, is_favorite);
CREATE INDEX idx_saved_searches_user_id ON user_saved_searches(user_id);
CREATE INDEX idx_saved_searches_active ON user_saved_searches(user_id, is_active);
CREATE INDEX idx_search_history_user_id ON user_search_history(user_id);
CREATE INDEX idx_search_history_searched_at ON user_search_history(searched_at DESC);
CREATE INDEX idx_viewed_properties_user_id ON user_viewed_properties(user_id);
CREATE INDEX idx_viewed_properties_viewed_at ON user_viewed_properties(viewed_at DESC);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_properties_updated_at
  BEFORE UPDATE ON user_saved_properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON user_saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create user profile automatically on signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (user_id, first_name, last_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NULL)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile (uncomment when Supabase auth is fully configured)
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION create_user_profile();

-- Helper function to get user stats
CREATE OR REPLACE FUNCTION get_user_stats(p_user_id UUID)
RETURNS TABLE (
  saved_properties_count BIGINT,
  favorite_properties_count BIGINT,
  saved_searches_count BIGINT,
  active_searches_count BIGINT,
  viewed_properties_count BIGINT,
  search_history_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(*) FROM user_saved_properties WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM user_saved_properties WHERE user_id = p_user_id AND is_favorite = TRUE),
    (SELECT COUNT(*) FROM user_saved_searches WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM user_saved_searches WHERE user_id = p_user_id AND is_active = TRUE),
    (SELECT COUNT(DISTINCT listing_key) FROM user_viewed_properties WHERE user_id = p_user_id),
    (SELECT COUNT(*) FROM user_search_history WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Function to clean old search history (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_search_history()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_search_history
  WHERE searched_at < NOW() - INTERVAL '90 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean old viewed properties (keep last 180 days)
CREATE OR REPLACE FUNCTION cleanup_old_viewed_properties()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_viewed_properties
  WHERE viewed_at < NOW() - INTERVAL '180 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Insert sample notification settings template
COMMENT ON COLUMN user_profiles.notification_settings IS 'JSONB object storing user notification preferences';
COMMENT ON COLUMN user_profiles.preferences IS 'JSONB object storing user app preferences like theme, language, etc.';
COMMENT ON TABLE user_social_connections IS 'Stores OAuth connections from Google, Facebook, etc.';
COMMENT ON TABLE user_saved_properties IS 'Properties saved/favorited by users';
COMMENT ON TABLE user_saved_searches IS 'Saved search criteria with alert settings';
COMMENT ON TABLE user_search_history IS 'History of all searches performed by users';
COMMENT ON TABLE user_viewed_properties IS 'Track which properties users have viewed';
