# PayEz API Response Standard - Enforcement System

## Overview

This system enforces the PayEz API Response Standard across all IDP ↔ Next.js communications with **crystal clear error messages** that tell developers exactly what to fix.

## Why This Matters

With global distributed contributors, API standard violations **will happen**. This system:

1. **Catches violations immediately** at the Next.js boundary
2. **Provides exact fixes** developers can copy-paste
3. **Logs structured data** for monitoring dashboards
4. **Never breaks client applications** - returns compliant error responses

## How It Works

### 1. Automatic Compliance Checking

Every call to `proxy_to_idp()` validates the IDP response:

```typescript
// ✅ GOOD: Compliant response passes through unchanged
{
  "success": true,
  "request_id": "abc123",
  "data": {...},
  "meta": { "request_id": "abc123", "operation": "get_users" }
}

// ❌ BAD: Non-compliant response generates detailed error
{
  "StatusCode": 200,
  "Value": { "users": [...] }  // Raw .NET controller response
}
```

### 2. Developer-Friendly Error Messages

When violations occur, you get **immediately actionable feedback**:

**Console Output:**
```
🚨 API Standard Violation in admin_users_get
Endpoint: http://localhost:32785/api/Admin/users
Request ID: req_abc123
HTTP Status: 200

📋 Violations:
  1. Missing required field: success
  2. Missing required field: request_id
  3. meta.requestId should be meta.request_id (snake_case violation)

🔧 How to Fix:
  1. Add [JsonPropertyName("success")] public bool Success { get; } to your response class
  2. Add [JsonPropertyName("request_id")] public string RequestId { get; set; } to your response class
  3. Change [JsonPropertyName("requestId")] to [JsonPropertyName("request_id")] in ApiMeta class

📖 Documentation: E:\Repos\PayEz-Core\docs\api-response-standard-how-to.md
```

**Client Response:**
```json
{
  "success": false,
  "message": "IDP response violates PayEz API standard: Missing required field: success; Missing required field: request_id",
  "operation_code": "admin_users_get",
  "request_id": "req_abc123",
  "error": {
    "code": "UPSTREAM_SERVICE_ERROR",
    "message": "...",
    "details": {
      "violations": ["Missing required field: success", "..."],
      "how_to_fix": [
        "The IDP controller must follow PayEz API Response Standard.",
        "Copy-paste these fixes into your C# controller:",
        "Add [JsonPropertyName(\"success\")] public bool Success { get; } to your response class",
        "..."
      ]
    }
  }
}
```

### 3. Monitoring & Analytics

Structured logs enable monitoring dashboards:

```json
{
  "event": "IDP_COMPLIANCE_VIOLATION",
  "severity": "ERROR",
  "endpoint": "http://localhost:32785/api/Admin/users",
  "operation": "admin_users_get",
  "violationCount": 3,
  "hasSnakeCaseViolation": true,
  "hasMissingFieldViolation": true,
  "violations": ["...", "...", "..."],
  "fixes": ["...", "...", "..."]
}
```

## Usage

### For Route Handlers

```typescript
import { proxy_to_idp } from '@/lib/payez-standard';

export const GET = async (req: NextRequest): Promise<Response> => {
  // This automatically validates and provides detailed errors
  return proxy_to_idp(req, `${ENV_CONFIG.IDP_BASE_URL}/api/Admin/users`, {
    method: 'GET',
    operation: 'admin_users_get'
  });
};
```

### For Testing & Development

**Test all endpoints:**
```bash
npm run test:compliance
```

**Test specific endpoints:**
```bash
npm run test:compliance users    # Test endpoints containing 'users'
npm run test:compliance roles    # Test endpoints containing 'roles'
```

**With authentication:**
```bash
TEST_AUTH_TOKEN="your-token-here" npm run test:compliance
```

### For Manual Validation

```typescript
import { validateResponse } from '@/lib/payez-standard';

const response = await fetch('/api/admin/users');
const body = await response.json();

const report = validateResponse(body, {
  endpoint: '/api/admin/users',
  operation: 'admin_users_get'
});

if (!report.passed) {
  console.log('Violations:', report.violations);
  console.log('Fixes:', report.fixes);
}
```

## Common Violations & Fixes

### 1. Snake Case Violations

**Violation:** `meta.requestId should be meta.request_id`

**Fix:**
```csharp
// ❌ Wrong
[JsonPropertyName("requestId")]
public string RequestId { get; set; }

// ✅ Correct
[JsonPropertyName("request_id")]
public string RequestId { get; set; }
```

### 2. Missing Required Fields

**Violation:** `Missing required field: success`

**Fix:**
```csharp
// Add to your response class
[JsonPropertyName("success")]
public abstract bool Success { get; }

[JsonPropertyName("operation_code")]
public string OperationCode { get; set; }

[JsonPropertyName("request_id")]
public string RequestId { get; set; }

[JsonPropertyName("timestamp")]
public DateTime Timestamp { get; set; }

[JsonPropertyName("meta")]
public ApiMeta Meta { get; set; }
```

### 3. Wrong Response Structure

**Violation:** `Invalid response format - must be either success or error response`

**Fix:**
```csharp
// ❌ Wrong - raw return
public IActionResult GetUsers()
{
    var users = GetUsersFromDb();
    return Ok(users);  // Returns raw data
}

// ✅ Correct - use base class
public IActionResult GetUsers()
{
    var users = GetUsersFromDb();
    return Ok(Success(users, "get_users"));  // Returns compliant wrapper
}
```

## Migration Strategy

### Phase 1: Immediate (Done ✅)
- [x] Strengthened compliance checking with detailed errors
- [x] Enhanced logging for monitoring
- [x] Testing tools for development

### Phase 2: Gradual Rollout
- [ ] Run `npm run test:compliance` to identify all violations
- [ ] Fix violations one controller at a time using provided fixes
- [ ] Add compliance checks to CI/CD pipeline
- [ ] Set up monitoring dashboard for violations

### Phase 3: Enforcement
- [ ] Add pre-commit hooks for JsonPropertyName validation
- [ ] Create code generation templates with proper attributes
- [ ] Add compliance requirements to PR checklist

## Benefits

1. **Zero Learning Curve**: Violations include exact fixes to copy-paste
2. **No Client Breakage**: Always returns compliant error responses
3. **Monitoring Ready**: Structured logs for dashboards and alerting  
4. **Developer Productivity**: Find and fix issues in seconds, not hours
5. **Global Scale Ready**: Works with distributed teams and varying experience levels

## Files Modified

- `src/lib/payez-standard.ts` - Enhanced compliance checker and error reporting
- `src/scripts/test-compliance.ts` - Developer testing tool
- `package.json` - Added compliance testing scripts
- `E:\Repos\PayEz-Core\PayEz.Apis\PayEz.External.Id.Api\Models\ApiResponse\ApiResponseModels.cs` - Fixed snake_case violations
- `E:\Repos\PayEz-Core\PayEz.Services\PayEz.DTOs\Models\Activity\ActivityModels.cs` - Added JsonPropertyName attributes

## Next Steps

1. **Install dependencies:** `npm install`
2. **Test current compliance:** `npm run test:compliance`
3. **Fix violations:** Use the provided fixes from the test output
4. **Monitor:** Watch console logs for violation reports
5. **Iterate:** Re-test until all endpoints are compliant

---

**Remember:** "THOU SHALT SNAKE TO LOWER BE THE WHOLE OF THE LAW" for all wire communications! 🐍
