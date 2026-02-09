# Dev profile: local setup for first-time development
# Usage: powershell -File dev-local.ps1 -Port 3000 -AppName "MyApp"
# This generates a NEXTAUTH_SECRET and starts the dev server
#
# IMPORTANT: For local development without external IDP

param(
  [int]$Port = 3000,
  [string]$AppName = "PayEz MVP"
)

Write-Host "Starting $AppName in LOCAL mode..." -ForegroundColor Cyan

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

# Generate a 64-byte random secret (base64) - compatible with Windows PowerShell 5.1+
$bytes = New-Object byte[] 64
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$rng.GetBytes($bytes)
$rng.Dispose()
$secret = [Convert]::ToBase64String($bytes)

Write-Host "Generated NEXTAUTH_SECRET for local development" -ForegroundColor Green
Write-Host "Add this to your .env.local file:" -ForegroundColor Yellow
Write-Host "NEXTAUTH_SECRET=$secret" -ForegroundColor Cyan
Write-Host ""

# Set environment variables for this session
$env:NEXTAUTH_SECRET = $secret
$env:PORT = "$Port"

Write-Host "Starting Next.js dev server on port $Port..." -ForegroundColor Green
Write-Host ""

# Use npx directly to avoid npm batch job nesting issues
npx next dev -p $Port
