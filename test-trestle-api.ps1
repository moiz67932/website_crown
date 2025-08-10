param(
    [Parameter(Mandatory=$false)]
    [string]$Password,
    [Parameter(Mandatory=$false)]
    [string]$ApiId
)

# Trestle API Test Script for PowerShell
# Usage: 
#   .\test-trestle-api.ps1 (uses .env file)
#   .\test-trestle-api.ps1 -Password "your_password" -ApiId "your_api_id"

# Function to load .env file
function Get-EnvVariable {
    param([string]$Name, [string]$Default = "")
    
    # First check command line parameters
    if ($Name -eq "TRESTLE_API_PASSWORD" -and $Password) { return $Password }
    if ($Name -eq "TRESTLE_API_ID" -and $ApiId) { return $ApiId }
    
    # Then check environment variables
    $envValue = [Environment]::GetEnvironmentVariable($Name)
    if ($envValue) { return $envValue }
    
    # Finally check .env file
    if (Test-Path ".env") {
        $envContent = Get-Content ".env"
        foreach ($line in $envContent) {
            if ($line -match "^$Name\s*=\s*(.+)$") {
                return $matches[1].Trim('"').Trim("'")
            }
        }
    }
    
    return $Default
}

$API_ID = Get-EnvVariable "TRESTLE_API_ID"
$Password = Get-EnvVariable "TRESTLE_API_PASSWORD" 
$BASE_URL = Get-EnvVariable "TRESTLE_BASE_URL" "https://api-prod.corelogic.com/trestle"

if (-not $API_ID -or -not $Password) {
    Write-Host "❌ Missing required credentials!" -ForegroundColor Red
    Write-Host "Please either:" -ForegroundColor Yellow
    Write-Host "  1. Set TRESTLE_API_ID and TRESTLE_API_PASSWORD in your .env file, or" -ForegroundColor Yellow
    Write-Host "  2. Use: .\test-trestle-api.ps1 -ApiId 'your_id' -Password 'your_password'" -ForegroundColor Yellow
    exit 1
}

Write-Host "🚀 Starting Trestle API Tests" -ForegroundColor Green
Write-Host "API ID: $API_ID"
Write-Host "Base URL: $BASE_URL"
Write-Host "Password: [HIDDEN]"
Write-Host "======================================" -ForegroundColor Yellow

# Create basic auth header
$credentials = [System.Convert]::ToBase64String([System.Text.Encoding]::ASCII.GetBytes("${API_ID}:${Password}"))
$headers = @{
    "Authorization" = "Basic $credentials"
    "Accept" = "application/json"
}

function Test-TrestleEndpoint {
    param(
        [string]$Endpoint,
        [string]$Description
    )
    
    Write-Host ""
    Write-Host "🔍 Testing: $Description" -ForegroundColor Cyan
    Write-Host "Endpoint: $Endpoint"
    Write-Host "---"
    
    try {
        $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
        $response = Invoke-RestMethod -Uri "$BASE_URL$Endpoint" -Headers $headers -Method Get
        $stopwatch.Stop()
        
        Write-Host "✅ Success!" -ForegroundColor Green
        Write-Host "Response Time: $($stopwatch.ElapsedMilliseconds)ms"
        
        if ($response -is [array]) {
            Write-Host "Records returned: $($response.Count)"
            if ($response.Count -gt 0) {
                Write-Host "Sample data:" -ForegroundColor Yellow
                $response[0] | ConvertTo-Json -Depth 2 | Write-Host
            }
        } elseif ($response.value) {
            Write-Host "Records returned: $($response.value.Count)"
            if ($response.value.Count -gt 0) {
                Write-Host "Sample data:" -ForegroundColor Yellow
                $response.value[0] | ConvertTo-Json -Depth 2 | Write-Host
            }
        } else {
            Write-Host "Response:" -ForegroundColor Yellow
            $response | ConvertTo-Json -Depth 2 | Write-Host
        }
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        }
    }
    
    Write-Host "======================================" -ForegroundColor Yellow
}

# Test 1: Basic Authentication
Test-TrestleEndpoint "/odata/Property?`$top=1&`$select=ListingKey,ListPrice,UnparsedAddress" "Basic Authentication Test"

# Test 2: Property Count
Write-Host ""
Write-Host "📊 Getting total property count..." -ForegroundColor Cyan
try {
    $count = Invoke-RestMethod -Uri "$BASE_URL/odata/Property/`$count" -Headers $headers -Method Get
    Write-Host "✅ Total properties: $count" -ForegroundColor Green
}
catch {
    Write-Host "❌ Failed to get count: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host "======================================" -ForegroundColor Yellow

# Test 3: Active Properties
Test-TrestleEndpoint "/odata/Property?`$top=5&`$filter=StandardStatus eq 'Active'&`$select=ListingKey,ListPrice,UnparsedAddress,StandardStatus" "Active Properties"

# Test 4: Property Types
Test-TrestleEndpoint "/odata/Property?`$select=PropertyType&`$top=10" "Property Types Sample"

# Test 5: Price Range Filter
Test-TrestleEndpoint "/odata/Property?`$top=3&`$filter=ListPrice gt 100000 and ListPrice lt 500000&`$select=ListingKey,ListPrice,UnparsedAddress" "Price Range Filter (100k-500k)"

# Test 6: Geographic Filter
Test-TrestleEndpoint "/odata/Property?`$top=3&`$filter=StateOrProvince eq 'CA'&`$select=ListingKey,ListPrice,UnparsedAddress,City,StateOrProvince" "Geographic Filter (California)"

# Test 7: Property Details
Test-TrestleEndpoint "/odata/Property?`$top=2&`$select=ListingKey,ListPrice,BedroomsTotal,BathroomsTotalInteger,LivingArea,PropertyType" "Property Details"

# Test 8: Recent Listings
Test-TrestleEndpoint "/odata/Property?`$top=3&`$orderby=OnMarketDate desc&`$select=ListingKey,ListPrice,OnMarketDate,UnparsedAddress" "Recent Listings"

Write-Host ""
Write-Host "🎉 All tests completed!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Yellow
Write-Host "   - If you see 401 errors, check your password"
Write-Host "   - If you see 403 errors, your API may have access restrictions"
Write-Host "   - If you see timeouts, the API might be slow or overloaded"
Write-Host "   - Save successful queries for your application integration" 