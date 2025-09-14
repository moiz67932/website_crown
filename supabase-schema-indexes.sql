-- Suggested performance indexes for property search filters & ordering
-- Apply in your Postgres (Supabase) environment once.
-- Safe to run multiple times using IF NOT EXISTS.

CREATE INDEX IF NOT EXISTS idx_properties_status ON properties (status);
CREATE INDEX IF NOT EXISTS idx_properties_modification_ts ON properties (modification_ts DESC);
CREATE INDEX IF NOT EXISTS idx_properties_first_seen_ts ON properties (first_seen_ts DESC);
CREATE INDEX IF NOT EXISTS idx_properties_list_price ON properties (list_price);
CREATE INDEX IF NOT EXISTS idx_properties_city_lower ON properties ((lower(city)));
CREATE INDEX IF NOT EXISTS idx_properties_state_lower ON properties ((lower(state)));
CREATE INDEX IF NOT EXISTS idx_properties_property_type_lower ON properties ((lower(property_type)));
-- Composite for common active listings sorted by modification time
CREATE INDEX IF NOT EXISTS idx_properties_active_mod_ts ON properties (status, modification_ts DESC);
-- Optional: if geo queries later
-- CREATE INDEX IF NOT EXISTS idx_properties_lat_lon ON properties (latitude, longitude);
