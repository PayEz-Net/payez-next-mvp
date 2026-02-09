# IDP API Authentication Reference Guide

## CRITICAL: READ THIS FIRST

This document provides the **EXACT** steps to authenticate with the IDP and make API calls. Future AIs: **DO NOT DEVIATE FROM THESE STEPS**. Do not guess endpoints, do not try variations, follow this exactly.

## Prerequisites

1. **IDP is running on port 32785** (http://localhost:32785)
2. **Login credentials are in** `tests/api-models/login.json`
3. **Redis is available** on 127.0.0.1:6379 for rate limiting

## Step 1: Authentication

### Endpoint: `/api/ExternalAuth/login`
- **Method**: POST
- **URL**: `http://localhost:32785/api/ExternalAuth/login`
- **Body**: Load directly from `tests/api-models/login.json`

### PowerShell Example:
```powershell
# Load login credentials
$loginBody = Get-Content "tests/api-models/login.json" -Raw

# Authenticate
$loginResponse = Invoke-RestMethod -Uri "http://localhost:32785/api/ExternalAuth/login" -Method POST -Body $loginBody -ContentType 'application/json'

# Extract access token from response
$accessToken = $loginResponse.result.access_token
```

### Expected Response Structure:
```json
{
  "result": {
    "access_token": "eyJhbGciOiJSUzUxMiIs...",
    "refresh_token": "...",
    "expires_in": 3600
  }
}
```

## Step 2: Making Authenticated API Calls

### Required Headers:
```powershell
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}
```

### Example API Call - Get User:
```powershell
# User endpoint requires POST with user_id in body
$userPayload = @{ user_id = 2 } | ConvertTo-Json
$userResponse = Invoke-RestMethod -Uri "http://localhost:32785/api/Admin/users/get" -Method POST -Body $userPayload -Headers $headers
```

## Step 3: Handling Rate Limiting

If you get 401 Unauthorized or rate limiting errors:

### Clear Redis Cache:
```powershell
redis-cli -h 127.0.0.1 FLUSHALL
```

## EXECUTION METHOD - CRITICAL

**DO NOT execute PowerShell commands line-by-line in the terminal.** Instead, provide the complete script below as a single block to be pasted into PowerShell at once.

## Complete Working Example

**Copy this ENTIRE script and paste it into PowerShell as one block:**

```powershell
# Test IDP Authentication and API Call
Write-Host "Testing IDP Authentication..." -ForegroundColor Green

# Step 1: Login
$loginBody = Get-Content "tests/api-models/login.json" -Raw
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:32785/api/ExternalAuth/login" -Method POST -Body $loginBody -ContentType 'application/json'
    $accessToken = $loginResponse.result.access_token
    Write-Host "Login successful" -ForegroundColor Green
    
    # DECODE AND EXAMINE JWT TOKEN STRUCTURE
    Write-Host "\n=== JWT TOKEN ANALYSIS ===" -ForegroundColor Cyan
    $tokenParts = $accessToken.Split('.')
    $headerJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[0] + "===="))
    $payloadJson = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($tokenParts[1] + "===="))
    
    Write-Host "JWT Header:" -ForegroundColor Yellow
    $headerJson | ConvertFrom-Json | ConvertTo-Json -Depth 3
    
    Write-Host "\nJWT Payload:" -ForegroundColor Yellow
    $payloadJson | ConvertFrom-Json | ConvertTo-Json -Depth 3
    
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    # Clear Redis if authentication fails
    redis-cli -h 127.0.0.1 FLUSHALL
    exit 1
}

# Step 2: Setup headers
$headers = @{
    "Authorization" = "Bearer $accessToken"
    "Content-Type" = "application/json"
}

# Step 3: Make authenticated API call
try {
    $userPayload = @{ user_id = 2 } | ConvertTo-Json
    $userResponse = Invoke-RestMethod -Uri "http://localhost:32785/api/Admin/users/get" -Method POST -Body $userPayload -Headers $headers
    
    Write-Host "\nAPI call successful" -ForegroundColor Green
    Write-Host "\n=== USER RESPONSE ===" -ForegroundColor Cyan
    $userResponse | ConvertTo-Json -Depth 3
} catch {
    Write-Host "API call failed: $($_.Exception.Message)" -ForegroundColor Red
}
```

## Known IDP Endpoints

### Authentication:
- `POST /api/ExternalAuth/login` - Login with credentials

### User Management:
- `POST /api/Admin/users/get` - Get user by ID (requires `{"user_id": number}` in body)
- `POST /api/Admin/users/toggle-approval` - Toggle user approval
- `POST /api/Admin/users/unlock` - Unlock user account
- `POST /api/Admin/users/pause` - Pause/blacklist user

### Role Management:
- `GET /api/Admin/roles` - Get all roles
- `GET /api/Admin/users/{userId}/roles` - Get user roles

### Client Management:
- `GET /api/Admin/clients` - Get all clients
- `GET /api/Admin/users/{userId}/client-authorizations` - Get user client access

## Response Data Structures

### User Response:
The IDP returns users with `user_id` field (NOT `id`):
```json
{
  "user_id": 2,
  "username": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "email": "user@example.com",
  "phone_number": "+1-555-1234",
  "full_name": "John Doe",
  "email_confirmed": true,
  "phone_confirmed": true,
  "two_factor_enabled": false,
  "is_approved": true,
  "lockout_enabled": false,
  "access_failed_count": 0,
  "created_at": "2025-01-01T00:00:00Z",
  "roles": ["payez_user", "payez_admin"],
  "success": true
}
```

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**: 
   - Clear Redis: `redis-cli -h 127.0.0.1 FLUSHALL`
   - Check if IDP is running on port 32785

2. **404 Not Found**:
   - Verify the endpoint URL is exact
   - Use POST for `/api/Admin/users/get`, not GET

3. **Rate Limiting**:
   - Clear Redis: `redis-cli -h 127.0.0.1 FLUSHALL`
   - Wait before retrying

4. **Invalid JSON**:
   - Load login.json with `Get-Content "tests/api-models/login.json" -Raw`
   - Don't manually type the JSON

## AI SCRIPT CREATION AND EXECUTION

**When working with AI assistants (like Claude), the AI should:**

1. **Create complete PowerShell scripts** following this documentation
2. **Provide the entire script as a single block** to be copied/pasted
3. **NOT execute PowerShell commands line-by-line** in the terminal
4. **Include JWT token decoding** to examine token structure when testing auth changes

### Existing PowerShell Scripts for Reference/Modification:

**1. `test-idp-user-clean.ps1`**
- Tests multiple auth endpoints automatically
- Examines user endpoint structures
- Shows complete response analysis
- **Use case**: Testing user endpoints and token structures

**2. `test-role-categories.ps1`**
- Secure password input handling
- Proper error handling with status codes
- Modular API function approach
- **Use case**: Testing role-related endpoints with authentication

**3. `tests/comprehensive-test-clean.ps1`**
- Full API test suite with authentication
- Tests multiple endpoints systematically
- Includes security testing (auth validation, rate limiting)
- **Use case**: Complete system validation and regression testing

**These scripts can be modified/extended for:**
- Testing new JWT token structures
- Validating role claim changes
- Testing new endpoints
- Debugging authentication issues

## DO NOT:
- ❌ Try different authentication endpoints
- ❌ Use GET for user endpoints that require POST
- ❌ Manually type JSON payloads
- ❌ Guess at field names or structures
- ❌ Use port 3200 when you want to hit IDP directly (3200 is Next.js)
- ❌ Execute PowerShell commands line-by-line when AI should provide complete scripts

## DO:
- ✅ Use exactly these endpoints and methods
- ✅ Load login.json directly from file
- ✅ Clear Redis when authentication fails
- ✅ Use `user_id` field from responses (not `id`)
- ✅ Use port 32785 for direct IDP access
- ✅ Have AI create complete PowerShell scripts for testing
- ✅ Include JWT token decoding in auth testing scripts

---

**This is the definitive reference. Follow it exactly.**
