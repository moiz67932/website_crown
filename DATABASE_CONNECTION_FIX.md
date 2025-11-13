# 🔧 Database Connection Fix Summary

## Problem
Your app was trying to use **Vercel OIDC authentication** (Cloud SQL Connector) on **localhost**, which failed because:
- The `x-vercel-oidc-token` header only exists on Vercel, not localhost
- Cloud SQL Connector with Workload Identity Federation requires Vercel runtime

## Solution Implemented

### Code Changes Made

#### 1. Updated `src/lib/db/connection.ts`
Added environment detection to choose the right connection method:

```typescript
async function createPool(): Promise<Pool> {
  // For localhost/development, prioritize DATABASE_URL to avoid OIDC token requirement
  const isLocalDev = process.env.NODE_ENV === 'development' || process.env.VERCEL !== '1';
  
  // 1) Use DATABASE_URL for local development (skip Cloud SQL Connector)
  if (isLocalDev && process.env.DATABASE_URL) {
    console.log('🌐 Local development detected - using direct DATABASE_URL connection');
    // ... creates direct TCP pool
  }

  // 2) Use DB_HOST for local development with Cloud SQL Proxy
  if (isLocalDev && process.env.DB_HOST) {
    console.log('🌐 Local development detected - using DB_HOST connection (Cloud SQL Proxy)');
    // ... creates TCP pool via proxy
  }

  // 3) Cloud SQL via connector (works on Vercel with OIDC)
  if (preferCloud) {
    // ... uses Cloud SQL Connector with OIDC
  }
}
```

**Key Logic:**
- ✅ **Localhost** (`NODE_ENV=development` or `VERCEL !== '1'`):
  - Uses `DATABASE_URL` directly → No OIDC, no Cloud SQL Connector
  - Fallback to `DB_HOST` if using Cloud SQL Proxy
  
- ✅ **Vercel** (`VERCEL=1`):
  - Uses Cloud SQL Connector with OIDC authentication
  - Requires `INSTANCE_CONNECTION_NAME` and GCP WIF variables

## How to Use

### For Localhost Development

You have **3 options** (choose one):

#### Option 1: Supabase (Recommended - No Issues) ⭐
```bash
# In your .env file:
DATABASE_URL=postgres://postgres.kfcahzuxkgnwgidceaor:coastalcrown!@#@aws-0-us-west-1.pooler.supabase.com:6543/postgres
```

#### Option 2: Cloud SQL Proxy (If you have gcloud)
1. Run proxy in terminal:
   ```bash
   gcloud sql auth-proxy project-df2ac395-af0e-487d-a17:us-central1:ccos-sql --port=5432
   ```
2. Update .env:
   ```bash
   DATABASE_URL=postgres://postgres:Marwah123@localhost:5432/redata
   ```

#### Option 3: Direct Connection (May fail due to firewall)
```bash
# Already in your .env:
DATABASE_URL=postgres://postgres:Marwah123@35.192.61.14:5432/redata?sslmode=require
```
⚠️ **Warning**: This requires your IP to be whitelisted in Cloud SQL

### For Vercel Production

See [`VERCEL_ENV_VARIABLES.md`](./VERCEL_ENV_VARIABLES.md) for complete list.

**Critical variables:**
```bash
# Do NOT set NODE_ENV (Vercel sets it automatically)
# Do NOT set DATABASE_URL (use Cloud SQL Connector instead)

# Cloud SQL Connector
DB_BACKEND=cloudsql
INSTANCE_CONNECTION_NAME=project-df2ac395-af0e-487d-a17:us-central1:ccos-sql
DB_USER=postgres
DB_PASSWORD=Marwah123
DB_NAME=redata

# GCP Workload Identity Federation
GCP_PROJECT_NUMBER=985698245379
GCP_WORKLOAD_IDENTITY_POOL_ID=vercel-pool
GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=vercel
GCP_SERVICE_ACCOUNT_EMAIL=website-sql-access@project-df2ac395-af0e-487d-a17.iam.gserviceaccount.com
```

## Testing

### Test Localhost Connection
```bash
node test-db-connection.js
```

Expected output:
```
🌐 Local development detected - using direct DATABASE_URL connection
✅ Connection successful!
```

### Test API Endpoint
```bash
npm run dev
# Then visit: http://localhost:3000/api/properties
```

Expected: Properties load without OIDC errors

## Files Changed

1. ✅ `src/lib/db/connection.ts` - Added environment detection
2. ✅ `.env` - Added comments explaining options
3. ✅ `VERCEL_ENV_VARIABLES.md` - Complete Vercel setup guide
4. ✅ `test-db-connection.js` - Quick connection tester
5. ✅ `DATABASE_CONNECTION_FIX.md` - This file

## Next Steps

1. **Choose a localhost option** from above and update your `.env`
2. **Test the connection**: `node test-db-connection.js`
3. **Test the API**: `npm run dev` → visit `/api/properties`
4. **For Vercel**: Add variables from `VERCEL_ENV_VARIABLES.md`

## Troubleshooting

### Still getting OIDC errors on localhost?
- Check `NODE_ENV=development` is in your `.env`
- Make sure you're not setting `VERCEL=1` anywhere
- Try Option 1 (Supabase) to avoid Cloud SQL entirely

### Connection timeout on localhost?
- Your IP might not be whitelisted in Cloud SQL
- Use Option 1 (Supabase) or Option 2 (Cloud SQL Proxy)

### Works on localhost but fails on Vercel?
- Ensure all GCP_* variables are set in Vercel
- Enable OIDC in Vercel project settings
- Check that `INSTANCE_CONNECTION_NAME` is correct
