# Dev profile: prod-like broker bootstrap via KV-signed client_assertion
# Usage: powershell -File dev-broker.ps1 -ClientId "my_app" -Port 3000 -AppName "MyApp"
# This script enables broker mode for PayEz MVP authentication
#
# IMPORTANT: Broker mode provides production-like OAuth/OIDC authentication

param(
  [string]$ClientId = "2",
  [int]$Port = 3000,
  [string]$AppName = "PayEz MVP"
)

Write-Host "Starting $AppName in BROKER mode..." -ForegroundColor Cyan

# Kill any existing process on the specified port
$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
if ($connections) {
    Write-Host "Port $Port is in use. Killing existing process..." -ForegroundColor Yellow
    $connections | ForEach-Object {
        Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 500
    Write-Host "Port $Port is now free" -ForegroundColor Green
}

# Set required environment variables for broker mode
$env:NEXT_CLIENT_ID = "$ClientId"
$env:USE_BROKER_MODE = "true"

Write-Host "Client ID: $ClientId" -ForegroundColor Green
Write-Host "Broker mode: ENABLED" -ForegroundColor Green
Write-Host "Starting Next.js dev server on port $Port..." -ForegroundColor Cyan

# Use npx directly to avoid npm batch job nesting issues
npx next dev -p $Port
