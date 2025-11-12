# 📊 DATABASE COLUMNS REFERENCE FOR ADMIN DASHBOARD

## TABLES & COLUMNS USED BY ADMIN DASHBOARD

### 1. **`properties` Table**
```sql
Used Columns:
- id (UUID)
- status (TEXT) → Values: 'Active', 'Sold', 'Pending', 'for_sale', 'sold', 'under_contract'
- address (TEXT) → For activity feed
- city (TEXT) → For activity feed
- created_at (TIMESTAMP) → For recent activity

Purpose:
- Property count stats
- Status breakdown (active/sold/pending)
- Recent property additions
```

### 2. **`posts` Table**
```sql
Used Columns:
- id (UUID)
- title (TEXT) → For activity feed
- slug (TEXT) → For SEO metrics
- status (TEXT) → Values: 'published', 'draft'
- views (INTEGER) → Total blog views
- meta_title (TEXT) → For SEO analysis
- meta_description (TEXT) → For SEO analysis
- excerpt (TEXT) → For SEO fallback
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP) → For recent activity

Purpose:
- Blog post count stats
- Published vs draft counts
- Total blog views
- Recent post activity
- SEO metrics generation
```

### 3. **`landing_pages` Table**
```sql
Used Columns:
- id (UUID)
- city (TEXT)
- state (TEXT)
- slug (TEXT) → For URL
- page_type (TEXT) → For filtering
- title (TEXT)
- description (TEXT)
- meta_title (TEXT) → For SEO
- meta_description (TEXT) → For SEO
- status (TEXT) → Values: 'published', 'draft'
- views (INTEGER) → Page views
- property_count (INTEGER) → Optional
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Purpose:
- Landing page count stats
- Page views aggregation
- Recent page generation activity
- SEO metrics generation
```

### 4. **`leads` Table**
```sql
Used Columns:
- id (UUID)
- name (TEXT) → For activity feed
- email (TEXT) → For activity feed
- message (TEXT) → For activity description
- status (TEXT) → Values: 'new', 'contacted', 'qualified', 'converted', 'closed', 'won'
- crm_status (TEXT) → For CRM pipeline stats
- created_at (TIMESTAMP) → For time-based filtering

Purpose:
- Total lead count
- Leads this month (last 30 days)
- Conversion tracking
- Lead pipeline stages
- Recent lead activity
```

### 5. **`page_views` Table**
```sql
Used Columns:
- id (UUID)
- page_url (TEXT) → To match landing pages/posts
- visitor_id (TEXT) → For unique visitor count
- session_id (TEXT) → For unique visitor count (fallback)
- time_on_page (INTEGER) → In seconds
- created_at (TIMESTAMP)

Purpose:
- Total page views count
- Unique visitors calculation
- Average session time
- Bounce rate calculation (<10s = bounce)
- SEO metrics (per-page analytics)
```

### 6. **`seo_metrics` Table** (Optional - auto-generated if missing)
```sql
Columns:
- id (UUID)
- page_url (TEXT)
- page_title (TEXT)
- meta_description (TEXT)
- keywords (TEXT[])
- google_rank (INTEGER) → Optional
- page_views (INTEGER)
- avg_time_on_page (INTEGER)
- bounce_rate (INTEGER)
- indexed (BOOLEAN)
- sitemap_included (BOOLEAN)
- schema_markup (BOOLEAN)
- mobile_friendly (BOOLEAN)
- page_speed_score (INTEGER)
- issues (TEXT[])
- last_checked (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

Purpose:
- SEO monitoring dashboard
- Page performance tracking
- Issue identification
```

---

## 📋 STATUS VALUE MAPPINGS

### **Properties Status:**
```typescript
Active Listings:
- 'Active'
- 'active'
- 'for_sale'

Sold:
- 'Sold'
- 'sold'

Pending:
- 'Pending'
- 'pending'
- 'under_contract'
```

### **Posts/Landing Pages Status:**
```typescript
Published:
- 'published'

Draft:
- 'draft'
```

### **Leads Status:**
```typescript
For general counting: ANY status

For conversion tracking:
- 'converted'
- 'closed'
- 'won'

For CRM Pipeline:
- 'new' → New leads
- 'contacted' → Reached out
- 'qualified' → Sales qualified
- 'converted' → Closed won
```

---

## 🔍 EXAMPLE QUERIES

### Get Properties Count by Status:
```sql
SELECT 
  status,
  COUNT(*) as count
FROM properties
GROUP BY status;
```

### Get Leads Last 30 Days:
```sql
SELECT COUNT(*)
FROM leads
WHERE created_at >= NOW() - INTERVAL '30 days';
```

### Get Total Blog Views:
```sql
SELECT SUM(views) as total_views
FROM posts
WHERE status = 'published';
```

### Get Unique Visitors:
```sql
SELECT COUNT(DISTINCT COALESCE(visitor_id, session_id))
FROM page_views;
```

### Calculate Bounce Rate:
```sql
SELECT 
  COUNT(CASE WHEN time_on_page < 10 THEN 1 END) * 100.0 / COUNT(*) as bounce_rate
FROM page_views
WHERE time_on_page IS NOT NULL;
```

---

## ⚠️ IMPORTANT NOTES

1. **NULL Values:** All queries handle NULL values gracefully with `COALESCE()` or filters

2. **Status Variations:** The code checks multiple status variations:
   - Case-insensitive where possible
   - Multiple equivalent values (e.g., 'Active' OR 'active' OR 'for_sale')

3. **Time Calculations:**
   - "This month" = Last 30 days (not calendar month)
   - "Last 7 days" used for trends
   - All timestamps are in UTC

4. **Fallback Values:**
   - If table is empty, shows 0 (not fake data)
   - If API fails, shows error state
   - If column missing, uses sensible defaults

5. **Performance:**
   - All queries use appropriate indexes
   - Parallel fetching with `Promise.all()`
   - Count-only queries use `{ count: "exact", head: true }`

---

## 🎯 REQUIRED INDEXES

For optimal performance, ensure these indexes exist:

```sql
-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON properties(created_at DESC);

-- Posts
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_updated_at ON posts(updated_at DESC);

-- Landing Pages
CREATE INDEX IF NOT EXISTS idx_landing_pages_status ON landing_pages(status);
CREATE INDEX IF NOT EXISTS idx_landing_pages_created_at ON landing_pages(created_at DESC);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);

-- Page Views
CREATE INDEX IF NOT EXISTS idx_page_views_page_url ON page_views(page_url);
CREATE INDEX IF NOT EXISTS idx_page_views_created_at ON page_views(created_at DESC);
```

These indexes are already included in `supabase-schema-indexes.sql` if you've run it!
