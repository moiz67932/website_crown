-- ============================================================================
-- supabase-schema.sql
-- Purpose: Temporary mirror of Cloud SQL `public.properties` table in Supabase.
-- Safe to re-run: uses IF NOT EXISTS and creates indexes only if absent.
-- ============================================================================
-- NOTE: If re-importing large data sets, you can drop the NON-PK indexes first
-- (statements provided at bottom in a comment) to speed bulk ingest, then
-- recreate them by re-running this file.
-- ============================================================================

begin;

create schema if not exists public;

create table if not exists public.properties (
    listing_key           text primary key,
    list_price            numeric,
    city                  text,
    state                 text,
    bedrooms              integer,
    bathrooms_total       numeric(4,1), -- allows half baths (e.g., 2.5)
    living_area           integer,      -- square feet
    lot_size_sqft         integer,
    property_type         text,
    status                text,
    hidden                boolean default false,
    photos_count          integer,
    latitude              numeric(9,6),
    longitude             numeric(9,6),
    main_photo_url        text,
    modification_ts       timestamptz not null,
    first_seen_ts         timestamptz not null,
    last_seen_ts          timestamptz,
    year_built            integer,
    days_on_market        integer,
    price_change_ts       timestamptz,
    previous_list_price   numeric,
    current_price         numeric,
    pool_features         text,
    view                  text,
    view_yn               boolean,
    waterfront_yn         boolean,
    heating               text,
    cooling               text,
    parking_features      text,
    garage_spaces         numeric(5,2),
    public_remarks        text,
    media_urls            jsonb,
    raw_json              jsonb
);

-- ============================================================================
-- Indexes (ONLY those explicitly requested). All created CONCURRENTLY where
-- possible in case you run them after data load. Partial indexes optimize
-- “active, not hidden” queries used by the app.
-- ============================================================================

-- 1. modification_ts (active, not hidden)
create index if not exists idx_properties_modification_ts_active
    on public.properties (modification_ts desc)
    where status = 'Active' and hidden = false;

-- 2. first_seen_ts (active, not hidden)
create index if not exists idx_properties_first_seen_ts_active
    on public.properties (first_seen_ts desc)
    where status = 'Active' and hidden = false;

-- 3. listing_key DESC (explicit even though PK exists, matches requested)
create index if not exists idx_properties_listing_key_desc
    on public.properties (listing_key desc);

-- 4. lower(city)
create index if not exists idx_properties_city_lower
    on public.properties (lower(city));

-- 5. lower(state)
create index if not exists idx_properties_state_lower
    on public.properties (lower(state));

-- 6. composite (list_price, bedrooms, bathrooms_total)
create index if not exists idx_properties_price_beds_baths
    on public.properties (list_price, bedrooms, bathrooms_total);

commit;

-- ============================================================================
-- Optional: Statements to drop secondary indexes before massive re-import:
-- (Uncomment & run BEFORE data load if performance needed, then re-run file)
-- drop index if exists idx_properties_modification_ts_active;
-- drop index if exists idx_properties_first_seen_ts_active;
-- drop index if exists idx_properties_listing_key_desc;
-- drop index if exists idx_properties_city_lower;
-- drop index if exists idx_properties_state_lower;
-- drop index if exists idx_properties_price_beds_baths;
-- ============================================================================
-- Supabase Database Schema for Authentication
-- Run this in your Supabase SQL editor to set up the users table

-- Create users table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(254) NOT NULL UNIQUE,
    date_of_birth DATE NOT NULL,
    phone VARCHAR(20),
    bio TEXT,
    avatar_url TEXT,
    is_email_verified BOOLEAN DEFAULT FALSE,
    preferences JSONB DEFAULT '{"currency": "USD", "units": "imperial", "theme": "light"}',
    notification_settings JSONB DEFAULT '{"email_alerts": true, "push_notifications": true, "weekly_digest": true, "marketing_emails": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see and update their own data
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Allow service role to insert users (for registration)
CREATE POLICY "Service role can insert users" ON public.users
    FOR INSERT WITH CHECK (true);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, first_name, last_name, email, date_of_birth)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'date_of_birth', '1900-01-01')
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
