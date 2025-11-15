# Development Startup Guide

## Quick Start (2 Terminal Windows Required)

### Terminal 1: Cloud SQL Proxy
```powershell
cd d:\Majid_Milestone_2\back
.\start-proxy.ps1
```

**Keep this terminal open!** You should see:
```
The proxy has started successfully and is ready for new connections!
```

### Terminal 2: Dev Server
```powershell
cd d:\Majid_Milestone_2\back
npm run dev
```

Then visit: http://localhost:3000/california/san-francisco/2-bedroom-apartments

---

## What the Proxy Does

The Cloud SQL Proxy creates a secure tunnel to your Google Cloud SQL database:
- **Without proxy**: Direct connection to `35.192.61.14:5432` (BLOCKED by firewall)
- **With proxy**: Connection to `127.0.0.1:5433` → proxy → Cloud SQL (WORKS!)

---

## Common Issues

### "ECONNREFUSED 127.0.0.1:5433"
**Problem**: Proxy is not running
**Solution**: Start the proxy in Terminal 1 (see above)

### "Proxy already running on port 5433"
**Problem**: Previous proxy instance still running
**Solution**: 
```powershell
# Find and kill the process
Get-Process -Name cloud-sql-proxy | Stop-Process -Force
# Then restart
.\start-proxy.ps1
```

### "Application Default Credentials not found"
**Problem**: Not authenticated with Google Cloud
**Solution**:
```powershell
gcloud auth application-default login
```

---

## Environment Variables

Your `.env` file should have:
```env
# Local development with Cloud SQL Proxy
DATABASE_URL=postgres://postgres:Marwah123@127.0.0.1:5433/redata

# DO NOT use direct IP - firewall blocks it
# DATABASE_URL=postgres://postgres:Marwah123@35.192.61.14:5432/redata
```

---

## Stopping Everything

1. **Stop Dev Server**: Press `Ctrl+C` in Terminal 2
2. **Stop Proxy**: Press `Ctrl+C` in Terminal 1

Both must be stopped before closing the terminal windows.
