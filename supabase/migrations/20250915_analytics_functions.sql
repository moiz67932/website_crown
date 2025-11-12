-- Analytics helper functions for admin dashboard

-- Drop table if exists to recreate with proper schema
DROP TABLE IF EXISTS errors CASCADE;

-- Create errors table
CREATE TABLE errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  severity TEXT,
  level TEXT,
  message TEXT,
  error_message TEXT,
  stack TEXT,
  source TEXT,
  endpoint TEXT,
  metadata JSONB
);

-- Create indexes
CREATE INDEX idx_errors_created_at ON errors(created_at DESC);
CREATE INDEX idx_errors_severity ON errors(severity);
CREATE INDEX idx_errors_level ON errors(level);

-- Function to get posts with most views in the last N days
CREATE OR REPLACE FUNCTION posts_with_most_views(days INTEGER DEFAULT 7)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  title_primary TEXT,
  views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.slug,
    p.title_primary,
    COUNT(pv.id) AS views
  FROM posts p
  LEFT JOIN page_views pv ON pv.post_id = p.id
  WHERE pv.created_at >= NOW() - (days || ' days')::INTERVAL
    OR pv.created_at IS NULL
  GROUP BY p.id, p.slug, p.title_primary
  ORDER BY views DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql;

-- Function to get views by day
CREATE OR REPLACE FUNCTION views_by_day(days INTEGER DEFAULT 30)
RETURNS TABLE (
  day DATE,
  views BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(created_at) AS day,
    COUNT(*) AS views
  FROM page_views
  WHERE created_at >= NOW() - (days || ' days')::INTERVAL
  GROUP BY DATE(created_at)
  ORDER BY day DESC;
END;
$$ LANGUAGE plpgsql;
