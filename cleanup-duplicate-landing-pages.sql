-- Cleanup Duplicate Landing Pages SQL Script
-- ==========================================
-- This script helps identify and remove duplicate landing page entries
-- that were created with inconsistent city name casing (e.g., "San Jose" vs "san jose")
--
-- Run this in your Supabase SQL Editor
-- IMPORTANT: Review the SELECT queries first before running DELETE commands!

-- ============================================================================
-- STEP 1: Identify duplicates with different casing
-- ============================================================================
-- This query shows all city/page_name combinations that have duplicates
-- due to case differences

SELECT 
    LOWER(city) as normalized_city,
    page_name,
    COUNT(*) as duplicate_count,
    ARRAY_AGG(DISTINCT city) as city_variants,
    ARRAY_AGG(id ORDER BY updated_at DESC) as ids_newest_first
FROM landing_pages
GROUP BY LOWER(city), page_name
HAVING COUNT(*) > 1
ORDER BY duplicate_count DESC, normalized_city;

-- ============================================================================
-- STEP 2: Preview records to keep (newest with title case)
-- ============================================================================
-- For each duplicate group, keep the most recently updated one with proper casing

WITH duplicates AS (
    SELECT 
        id,
        city,
        page_name,
        updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(city), page_name 
            ORDER BY 
                -- Prefer title case (starts with uppercase)
                CASE WHEN city ~ '^[A-Z]' THEN 0 ELSE 1 END,
                -- Then by most recent update
                updated_at DESC
        ) as rn
    FROM landing_pages
)
SELECT id, city, page_name, updated_at, rn as rank
FROM duplicates
WHERE rn = 1
ORDER BY city, page_name;

-- ============================================================================
-- STEP 3: Preview records to DELETE (duplicates to remove)
-- ============================================================================
-- These are the duplicate records that will be removed

WITH duplicates AS (
    SELECT 
        id,
        city,
        page_name,
        updated_at,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(city), page_name 
            ORDER BY 
                -- Prefer title case (starts with uppercase)
                CASE WHEN city ~ '^[A-Z]' THEN 0 ELSE 1 END,
                -- Then by most recent update
                updated_at DESC
        ) as rn
    FROM landing_pages
)
SELECT id, city, page_name, updated_at
FROM duplicates
WHERE rn > 1
ORDER BY city, page_name;

-- ============================================================================
-- STEP 4: DELETE the duplicates (RUN ONLY AFTER REVIEWING STEP 3!)
-- ============================================================================
-- CAUTION: This permanently removes the duplicate rows!
-- Make sure to backup your data before running this.

-- Uncomment the following to execute the deletion:

/*
WITH duplicates AS (
    SELECT 
        id,
        ROW_NUMBER() OVER (
            PARTITION BY LOWER(city), page_name 
            ORDER BY 
                -- Prefer title case (starts with uppercase)
                CASE WHEN city ~ '^[A-Z]' THEN 0 ELSE 1 END,
                -- Then by most recent update
                updated_at DESC
        ) as rn
    FROM landing_pages
)
DELETE FROM landing_pages
WHERE id IN (
    SELECT id FROM duplicates WHERE rn > 1
);
*/

-- ============================================================================
-- STEP 5: Verify cleanup was successful
-- ============================================================================
-- After running the delete, this should return no rows

SELECT 
    LOWER(city) as normalized_city,
    page_name,
    COUNT(*) as count
FROM landing_pages
GROUP BY LOWER(city), page_name
HAVING COUNT(*) > 1;

-- ============================================================================
-- STEP 6: Update remaining rows to use consistent title case
-- ============================================================================
-- This updates any lowercase city names to title case

-- Uncomment to execute:

/*
UPDATE landing_pages
SET city = INITCAP(city)
WHERE city <> INITCAP(city);
*/
