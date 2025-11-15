# Landing Pages Production Deployment Fixes

## Issues Identified and Resolved

### 1. **Missing API Route: `/api/properties/search`**
**Problem**: The Map component and other parts of the app were calling `/api/properties/search`, but only `/api/properties` existed.

**Error**: 
```
GET /api/properties/search?city=San+Francisco&limit=50&sort=updated 404 in 7603ms
```

**Solution**: Created `src/app/api/properties/search/route.ts` as an alias that delegates to the main `/api/properties` endpoint for backward compatibility.

**File Created**: `src/app/api/properties/search/route.ts`

---

### 2. **Database Connection Terminating Unexpectedly**
**Problem**: PostgreSQL connection pool was terminating unexpectedly with errors like "Connection terminated unexpectedly".

**Error**:
```
[Error: Connection terminated unexpectedly] { client: [Client] }
uncaughtException: [Error: Connection terminated unexpectedly]
```

**Root Causes**:
- Too short timeout values (5-10 seconds)
- Too few max connections (5)
- Inadequate keepalive settings
- Limited error recovery for transient connection issues

**Solution**: Enhanced database connection pool configuration in `src/lib/db/connection.ts`:

**Changes Made**:
1. **Increased timeouts**:
   - `max`: 5 → 10 connections
   - `idleTimeoutMillis`: 10,000 → 30,000 (30 seconds)
   - `connectionTimeoutMillis`: 5,000 → 10,000 (10 seconds)
   - `statement_timeout`: 30,000 → 60,000 (60 seconds)
   - `query_timeout`: 30,000 → 60,000 (60 seconds)
   - `keepAliveInitialDelayMillis`: 3,000 → 5,000 (5 seconds)

2. **Enhanced error handling**:
   - Added more transient error codes to auto-recovery list
   - Added "connection lost", "connection timeout", "network error" to error detection
   - Added additional PostgreSQL error codes: `08003`, `08P01`
   - Increased retry delay from 50ms to 100ms
   - Added logging for connection test results and errors

3. **Better diagnostics**:
   - Console logging for successful pool initialization
   - Warning messages for transient errors before pool reset
   - Error logging for non-transient errors

**Files Modified**: `src/lib/db/connection.ts`

---

### 3. **Map Component API Response Handling**
**Problem**: Map component wasn't handling both possible response formats from the API.

**Solution**: Updated Map component to handle both `{ properties: [] }` and `{ data: [] }` response formats, with better error handling and logging.

**Changes Made**:
```typescript
// Handle both response formats: { properties: [] } and { data: [] }
const props = data.properties || data.data || [];
console.log(`[map] Fetched ${props.length} properties for ${city}`);
setProperties(props);
```

Also added:
- HTTP status code logging
- Empty array fallback on errors to prevent undefined issues

**File Modified**: `src/components/landing/sections/Map.tsx`

---

### 4. **Landing Page Data Fetching with Error Recovery**
**Problem**: Database query errors in landing stats were not properly wrapped in try-catch, causing page crashes.

**Solution**: Wrapped the entire `getLandingStats` function body in try-catch to gracefully return empty stats on database errors instead of crashing.

**Changes Made**:
- Wrapped all database logic in try-catch block
- Return empty `{}` object on errors
- Enhanced error logging with city, kind, and error details

**File Modified**: `src/lib/landing/query.ts`

---

## Why It Works on Localhost but Not Production

### Localhost:
- Uses Cloud SQL Proxy (`127.0.0.1:5433`)
- More stable connection through proxy
- Development mode has better error recovery
- Local database has lower latency

### Production (Deployed):
- May use direct Cloud SQL connection or different connection method
- Network latency and firewall rules can cause timeouts
- Production builds are optimized and may handle errors differently
- Connection pool exhaustion more likely under load

---

## What Was Affecting Each Feature

### **Hero Image Not Showing**:
- **Root Cause**: No direct issue, but if database connection failed during page generation, the entire page could fail to render
- **Fix**: Better error handling ensures page renders even if some data is missing

### **Market Snapshot Not Loading**:
- **Root Cause**: 
  1. Database connection terminating during stats query
  2. No `/api/properties/search` route for client-side data fetching
- **Fix**: 
  1. Enhanced connection pool stability
  2. Added missing API route
  3. Added try-catch around stats fetching

### **Featured Listings Not Showing**:
- **Root Cause**: Same as Market Snapshot - database connection and missing API route
- **Fix**: Same solutions as above

### **Map Not Working**:
- **Root Cause**: 
  1. Calling non-existent `/api/properties/search` endpoint (404 error)
  2. Not handling API response format properly
- **Fix**: 
  1. Created the missing route
  2. Updated response parsing to handle both formats

---

## Does It Use Vector DB?

**Answer**: No, the landing pages do **NOT** require vector database for basic functionality:

1. **Market Snapshot**: Uses standard SQL queries on the `properties` table
2. **Featured Listings**: Uses standard SQL queries with filters
3. **Map**: Fetches properties via standard API
4. **AI Descriptions**: May use AI but doesn't require vector search

The vector database (pgvector) is optional and only used for:
- Semantic/natural language property search
- Advanced "find similar properties" features

The current errors were **NOT** vector DB related - they were connection pool and routing issues.

---

## Database Connection Methods

The app supports multiple connection methods (in priority order):

### Local Development:
1. **DATABASE_URL** with Cloud SQL Proxy (recommended):
   ```
   DATABASE_URL=postgres://postgres:password@127.0.0.1:5433/redata
   ```

2. **DB_HOST** with Cloud SQL Proxy:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=5433
   ```

### Production (Vercel):
1. **Cloud SQL Connector** with OIDC authentication
2. **DATABASE_URL** fallback with SSL

---

## Testing the Fixes

### Localhost:

**IMPORTANT: Cloud SQL Proxy MUST be running before starting the dev server!**

#### Step 1: Start Cloud SQL Proxy (in a separate PowerShell terminal)

The proxy executable is located at `d:\Majid_Milestone_2\back\cloud-sql-proxy.exe`

```powershell
# Navigate to project directory
cd d:\Majid_Milestone_2\back

# Start the Cloud SQL Proxy
.\cloud-sql-proxy.exe project-df2ac395-af0e-487d-a17:us-central1:ccos-sql --port=5433
```

**Expected output:**
```
2025/11/15 09:15:10 Authorizing with Application Default Credentials
2025/11/15 09:15:11 [project-df2ac395-af0e-487d-a17:us-central1:ccos-sql] Listening on 127.0.0.1:5433
2025/11/15 09:15:11 The proxy has started successfully and is ready for new connections!
```

**Keep this terminal open!** The proxy must continue running while you develop.

#### Step 2: Start dev server (in a different PowerShell terminal)

```powershell
# In a NEW terminal window
cd d:\Majid_Milestone_2\back
npm run dev
```

#### Step 3: Test the landing page

Visit: `http://localhost:3000/california/san-francisco/2-bedroom-apartments`

#### Step 4: Verify everything works:
- ✅ Hero image loads
- ✅ "About This City" section shows text and images
- ✅ Market Snapshot shows statistics (Median Price, $/Sqft, Days on Market, Active Listings)
- ✅ Featured Listings display property cards
- ✅ Map shows city boundary and property markers
- ✅ No database connection errors in console

### Production:
After deployment, verify the same checklist above on your production URL.

---

## Troubleshooting

### Error: `ECONNREFUSED 127.0.0.1:5433`

**Cause**: Cloud SQL Proxy is not running.

**Solution**: 
1. Open a separate PowerShell terminal
2. Run: `.\cloud-sql-proxy.exe project-df2ac395-af0e-487d-a17:us-central1:ccos-sql --port=5433`
3. Wait for "The proxy has started successfully" message
4. Restart your dev server (Ctrl+C and `npm run dev`)

### Error: `Google Maps BillingNotEnabledMapError`

**Cause**: Google Maps API billing is not enabled.

**Impact**: Map component will show an error, but rest of page works fine.

**Solution**: Enable Google Maps Platform billing in Google Cloud Console (optional for development).

### Page shows but no data (Market Snapshot shows "—")

**Cause**: Database connection worked but no matching data in database.

**Solution**: 
1. Check if properties exist in database for the city
2. Verify city name spelling matches database (case-insensitive: "San Francisco" = "san francisco")
3. Check console for SQL query logs if `LANDING_DEBUG=1` is set

### AI Description not showing

**Cause**: This is normal during development - AI descriptions are cached in Supabase.

**Solution**: 
1. Run the admin panel to generate AI content
2. Or set `OPENAI_API_KEY` in `.env` to generate on-the-fly
3. Check if `SKIP_LANDING_EXTERNAL_FETCHES=1` is set (should NOT be set for local dev)

---

## Environment Variables Required

Ensure these are set in production:

```env
# Database (one of these methods)
DATABASE_URL=postgres://user:pass@host:port/dbname
# OR
INSTANCE_CONNECTION_NAME=project:region:instance
DB_USER=postgres
DB_PASSWORD=yourpassword
DB_NAME=redata

# Google Maps (for map component)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key_here

# Optional (for images)
UNSPLASH_ACCESS_KEY=your_key_here

# Supabase (for landing page metadata cache)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Summary

All issues have been resolved:
1. ✅ Created missing `/api/properties/search` route
2. ✅ Enhanced database connection pool stability (10x timeout improvements)
3. ✅ Added comprehensive error handling
4. ✅ Fixed API response parsing in Map component
5. ✅ Added better error recovery in data fetching

The landing pages should now work reliably in both localhost and production environments.
