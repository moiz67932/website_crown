param(
  [string]$city = 'San Diego',
  [string[]]$nearby = @('La Jolla','Encinitas'),
  [string]$type = 'moving'
)

if (-not $env:CRON_SECRET) { Write-Host "Warning: CRON_SECRET not set in environment." }

Write-Host "Generating blog for $city..."

$body = @{ type=$type; city=$city; nearby=$nearby; options=@{ makeAB=$true; linkPropertiesLimit=3 } } | ConvertTo-Json -Depth 10
$gen = Invoke-RestMethod -Uri "http://localhost:3000/api/blog/generate" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body $body
Write-Host "Generate response:" $gen
if (-not $gen.ok) { Write-Error "Generate failed: $($gen.error)"; exit 1 }
$postId = $gen.postId

Write-Host "Fetching images for post $postId..."
$imgBody = @{ postId=$postId; heroImagePrompt="$city relocation lifestyle"; imagePrompts=@("moving boxes in modern home","family settling in $city","city skyline aerial","coastal neighborhood street") } | ConvertTo-Json -Depth 10
$imgRes = Invoke-RestMethod -Uri "http://localhost:3000/api/blog/images" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body $imgBody
Write-Host "Images response:" $imgRes

Write-Host "Scheduling post for publish via cron endpoint..."
Write-Host "Run this SQL against your DB:"
Write-Host "update posts set status='scheduled', scheduled_at=now() - interval '1 minute' where id='$postId';"

Invoke-RestMethod -Uri "http://localhost:3000/api/cron/publish" -Headers @{ "x-cron-secret" = $env:CRON_SECRET }
Write-Host "Done. Check /blog/<slug> after publish." 
