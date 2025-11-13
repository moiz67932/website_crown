# 🚨 LOCALHOST DATABASE CONNECTION ISSUE - SOLUTION

## The Problem
Your properties are stored in **Google Cloud SQL**, and the direct IP connection (`35.192.61.14:5432`) is **blocked by firewall**.

You're seeing one of these errors:
- ❌ `connect ETIMEDOUT 35.192.61.14:5432`
- ❌ `Error [VercelOidcTokenError]: The 'x-vercel-oidc-token' header is missing`

## The Solution: Use Cloud SQL Proxy

Cloud SQL Proxy creates a secure tunnel to your Cloud SQL instance on localhost.

---

## 📥 Setup Instructions (One-time)

### Step 1: Install Google Cloud CLI

**Windows:**
1. Download installer: https://cloud.google.com/sdk/docs/install
2. Run the installer
3. Restart PowerShell after installation

**Verify installation:**
```powershell
gcloud --version
```

### Step 2: Authenticate with Google Cloud

```powershell
# Login to Google Cloud
gcloud auth login

# Set your project
gcloud config set project project-df2ac395-af0e-487d-a17

# Verify
gcloud config list
```

---

## 🚀 Daily Usage (Every time you develop)

### Terminal 1: Run Cloud SQL Proxy
```powershell
# Run this and KEEP IT RUNNING
gcloud sql auth-proxy project-df2ac395-af0e-487d-a17:us-central1:ccos-sql --port=5432
```

You should see:
```
Listening on 127.0.0.1:5432
The proxy has started successfully and is ready for new connections!
```

**⚠️ Keep this terminal open while developing!**

### Terminal 2: Update your .env

In your `.env` file, change DATABASE_URL to:
```bash
DATABASE_URL=postgres://postgres:Marwah123@127.0.0.1:5432/redata
```

Also make sure these are commented out:
```bash
# DB_BACKEND=cloudsql
# INSTANCE_CONNECTION_NAME=project-df2ac395-af0e-487d-a17:us-central1:ccos-sql
```

### Terminal 3: Run your dev server
```powershell
npm run dev
```

Now test: http://localhost:3000/api/properties

---

## ✅ Expected Output

### In Proxy Terminal:
```
Listening on 127.0.0.1:5432
Ready for new connections
```

### In Dev Server Terminal:
```
🏠 Properties API: Fetching from Postgres...
🌐 Local development detected - using DATABASE_URL
🌐 Using direct TCP connection via DATABASE_URL
✅ Found X properties
```

---

## 🔧 Alternative: Whitelist Your IP (Requires Cloud SQL Admin)

If you have admin access to Cloud SQL, you can whitelist your IP:

1. Go to Google Cloud Console
2. Navigate to SQL > ccos-sql > Connections
3. Add your current IP to "Authorized networks"
4. Then use direct connection:
   ```bash
   DATABASE_URL=postgres://postgres:Marwah123@35.192.61.14:5432/redata?sslmode=require
   ```

⚠️ **Note:** This is less secure and your IP changes when you change networks.

---

## 📋 Quick Reference

### Files Changed
- ✅ `src/lib/db.ts` - Added localhost detection
- ✅ `src/lib/db/connection.ts` - Added localhost detection
- ✅ `.env` - Added Cloud SQL Proxy instructions

### Environment Variables (localhost)
```bash
NODE_ENV=development
DATABASE_URL=postgres://postgres:Marwah123@127.0.0.1:5432/redata

# These MUST be commented out for localhost:
# DB_BACKEND=cloudsql
# INSTANCE_CONNECTION_NAME=project-df2ac395-af0e-487d-a17:us-central1:ccos-sql
```

### Environment Variables (Vercel - Production)
```bash
# Set these in Vercel dashboard
DB_BACKEND=cloudsql
INSTANCE_CONNECTION_NAME=project-df2ac395-af0e-487d-a17:us-central1:ccos-sql
GCP_PROJECT_NUMBER=985698245379
GCP_WORKLOAD_IDENTITY_POOL_ID=vercel-pool
GCP_WORKLOAD_IDENTITY_POOL_PROVIDER_ID=vercel
GCP_SERVICE_ACCOUNT_EMAIL=website-sql-access@project-df2ac395-af0e-487d-a17.iam.gserviceaccount.com

# Do NOT set DATABASE_URL on Vercel
```

---

## 🐛 Troubleshooting

### "gcloud: command not found"
- Restart PowerShell after installing gcloud CLI
- Or add to PATH: `C:\Users\YOUR_USER\AppData\Local\Google\Cloud SDK\google-cloud-sdk\bin`

### "Permission denied" when running proxy
- Run `gcloud auth login` again
- Make sure you're logged in to the correct Google account

### "Error connecting to Cloud SQL instance"
- Check instance name is correct: `project-df2ac395-af0e-487d-a17:us-central1:ccos-sql`
- Make sure you have permissions on the GCP project

### Still getting OIDC errors
- Make sure `INSTANCE_CONNECTION_NAME` is commented out in `.env`
- Restart your dev server after changing `.env`
- Check `NODE_ENV=development` is set

---

## 📞 Need Help?

The **only reliable way** to connect to Cloud SQL from localhost is:
1. Run Cloud SQL Proxy
2. Connect to `127.0.0.1:5432`
3. Comment out `INSTANCE_CONNECTION_NAME` in `.env`

There's no workaround without either:
- Installing Cloud SQL Proxy, OR
- Getting your IP whitelisted in Cloud SQL
