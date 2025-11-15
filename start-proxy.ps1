# Cloud SQL Proxy Startup Script
# Run this in a separate PowerShell terminal before starting your dev server

Write-Host "🚀 Starting Cloud SQL Proxy..." -ForegroundColor Green
Write-Host ""
Write-Host "Instance: project-df2ac395-af0e-487d-a17:us-central1:ccos-sql" -ForegroundColor Cyan
Write-Host "Port: 5433" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Keep this terminal open while developing!" -ForegroundColor Yellow
Write-Host "⚠️  Press Ctrl+C to stop the proxy" -ForegroundColor Yellow
Write-Host ""

# Check if cloud-sql-proxy.exe exists
if (-not (Test-Path ".\cloud-sql-proxy.exe")) {
    Write-Host "❌ ERROR: cloud-sql-proxy.exe not found!" -ForegroundColor Red
    Write-Host "Expected location: $PWD\cloud-sql-proxy.exe" -ForegroundColor Red
    Write-Host ""
    Write-Host "Download from: https://cloud.google.com/sql/docs/mysql/connect-admin-proxy#install" -ForegroundColor Yellow
    exit 1
}

# Start the proxy
.\cloud-sql-proxy.exe project-df2ac395-af0e-487d-a17:us-central1:ccos-sql --port=5433
