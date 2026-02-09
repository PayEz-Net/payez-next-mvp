# PayEz Token Type Determination and Validation

## Overview

The PayEz platform uses a role-based token type system to determine the appropriate validation and authorization rules for JWT bearer tokens. This document outlines how token types are determined and validated across the system.

**Last Updated:** July 2025  
**Version:** 1.0  
**Applies to:** PayEz Core Infrastructure & Membership Website  

---

## Token Type Classification

The system supports three distinct token types, each with specific validation requirements and authorization rules:

### 1. Merchant Tokens
- **Purpose**: Standard merchant user access
- **Identification**: Tokens containing the `"merchant"` role
- **Key Type**: `TokenSigningKeyType.Merchant`
- **Audience**: `cloud.payez.net`, `api.payez.net`

### 2. External IDP Tokens
- **Purpose**: PayEz admin and corporate user access
- **Identification**: Tokens containing roles starting with `"payez_"`
- **Key Type**: `TokenSigningKeyType.Corporate`
- **Audience**: `idp.payez.net`

### 3. Corporate Tokens
- **Purpose**: Company applications (like Cryptaply) that use the IDP as clients for authentication
- **Identification**: All other tokens (after merchant and payez_ role checks)
- **Key Type**: `TokenSigningKeyType.Corporate`
- **Audience**: `idp.payez.net`

---

## Token Type Determination Logic

### Implementation Location
**File**: `PayEz.Infrastructure\Services\IdentityBearerTokenService.cs`  
**Method**: `DetermineTokenTypeAndKey(ClaimsPrincipal principal)`  
**Lines**: 789-810  

### Determination Algorithm

```csharp
private (TokenValidationType type, TokenSigningKeyType keyType) DetermineTokenTypeAndKey(ClaimsPrincipal principal)
{
    var roles = principal.Claims
        .Where(c => c.Type == "role" || c.Type == ClaimTypes.Role)
        .Select(c => c.Value)
        .ToList();

    // Priority 1: Merchant tokens
    if (roles.Contains("merchant"))
    {
        return (TokenValidationType.Merchant, TokenSigningKeyType.Merchant);
    }

    // Priority 2: External IDP tokens (PayEz admin roles)
    if (roles.Any(r => r.StartsWith("payez_")))
    {
        return (TokenValidationType.ExternalIdp, TokenSigningKeyType.Corporate);
    }

    // Priority 3: Corporate tokens (company applications using IDP as clients)
    return (TokenValidationType.Corporate, TokenSigningKeyType.Corporate);
}
```

### Decision Flow

```
Token Claims Analysis
        ↓
Has "merchant" role?
        ├─ YES → Merchant Token
        └─ NO
            ↓
Has role starting with "payez_"?
        ├─ YES → External IDP Token
        └─ NO → Corporate Token (Company Applications)
```

---

## Validation Requirements

### Merchant Token Validation

**Required Claims:**
- `merchant_id` - Merchant identifier
- `role` - Must contain "merchant"
- `user_id` - User identifier
- `sub` - Subject claim
- `jti` - JWT ID
- `token_type` - Token type identifier

**Required Claim Values:**
- `role` = `"merchant"`
- `aud` = Original audience (e.g., `cloud.payez.net`)

**Validation Logic:**
```csharp
case TokenValidationType.Merchant:
    if (!roles.Contains("merchant"))
    {
        error = "Token does not have merchant role";
        return false;
    }
    break;
```

### External IDP Token Validation

**Required Claims:**
- `role` - Must contain role starting with "payez_"
- `user_id` - User identifier
- `sub` - Subject claim
- `jti` - JWT ID
- `token_type` - Token type identifier

**Required Claim Values:**
- `aud` = `"idp.payez.net"`

**Validation Logic:**
```csharp
case TokenValidationType.ExternalIdp:
    if (!roles.Any(r => r.StartsWith("payez_")))
    {
        error = "Token does not have any payez_ roles";
        return false;
    }
    break;
```

**Valid PayEz Roles:**
- `payez_admin` - Administrative access
- `payez_user` - Standard user access
- `payez_support` - Support team access
- Any other role starting with `payez_`

### Corporate Token Validation

**Purpose**: These tokens are for company applications (like Cryptaply and other business MVPs) that use the PayEz IDP as their authentication provider.

**Required Claims:**
- `role` - Must contain approved corporate role
- `user_id` - User identifier
- `sub` - Subject claim
- `jti` - JWT ID
- `token_type` - Token type identifier

**Required Claim Values:**
- `aud` = `"idp.payez.net"`

**Validation Logic:**
```csharp
case TokenValidationType.Corporate:
    var corporateRoles = new[]
    {
        "PAYEZ_ADMIN",
        "CRYPTAPLY_ADMIN", 
        "EXECUTIVE_ADMIN",
        "CRYPTAPLY_SUPPORT",
        "PAYEZ_SUPPORT"
    };
    if (!roles.Any(r => corporateRoles.Contains(r.ToUpperInvariant())))
    {
        error = "Token does not have any corporate roles";
        return false;
    }
    break;
```

---

## Role Examples and Classifications

### Merchant User Examples
```json
{
  "role": ["merchant", "basic_user"],
  "merchant_id": "12345",
  "user_id": "67890"
}
```
→ **Classification**: Merchant Token

### PayEz Admin Examples
```json
{
  "role": ["payez_admin", "payez_user"],
  "user_id": "12345"
}
```
→ **Classification**: External IDP Token

### Corporate Application Examples
```json
{
  "role": ["CRYPTAPLY_ADMIN", "EXECUTIVE_ADMIN"],
  "user_id": "12345"
}
```
→ **Classification**: Corporate Token (Company Application User)

### Mixed Role Examples
```json
{
  "role": ["merchant", "payez_admin"],
  "merchant_id": "12345",
  "user_id": "67890"
}
```
→ **Classification**: Merchant Token (merchant takes priority)

---

## Security Considerations

### Token Type Priority
The determination follows a strict priority order to prevent privilege escalation:

1. **Merchant tokens have highest priority** - Prevents non-merchants from accessing merchant resources
2. **PayEz admin tokens second** - Allows admin access to corporate resources
3. **Corporate tokens for company apps** - Handles tokens from company applications (Cryptaply, etc.) using IDP as clients

### Validation Security
- **Exact role matching** for merchant tokens
- **Prefix matching** for PayEz roles (allows flexibility for new admin roles)
- **Uppercase normalization** for corporate roles (backwards compatibility)
- **Audience validation** ensures tokens are used for intended services

### Common Security Patterns

#### Role Escalation Prevention
```csharp
// ❌ WRONG: This could allow privilege escalation
if (roles.Contains("admin") || roles.Contains("merchant"))

// ✅ CORRECT: Priority-based checking
if (roles.Contains("merchant")) return Merchant;
else if (roles.StartsWith("payez_")) return ExternalIdp;
else return Corporate;
```

#### Audience Validation
```csharp
// Merchant tokens can use original audience
identityRequest.ValidationRequirements.RequiredClaimValues["aud"] = audience;

// Corporate/ExternalIdp tokens must use specific audience
identityRequest.ValidationRequirements.RequiredClaimValues["aud"] = "idp.payez.net";
```

---

## Integration Points

### Membership Website Integration

The membership website (`website-membership`) receives tokens from the IDP and validates them through the PayEz Core infrastructure:

1. **Token Receipt**: User authenticates via NextAuth
2. **Token Classification**: PayEz Core determines token type based on roles
3. **Validation**: Appropriate validation rules applied
4. **Authorization**: Access granted based on token type and endpoint requirements

### API Endpoint Authorization

Different endpoints require different token types:

```typescript
// Merchant-only endpoints
const handler = createHandlerWithMiddleware.auto('/api/account/masked-info', {
  ...API_CONFIGS.MERCHANT  // Requires merchant role
});

// Admin endpoints (PayEz admin roles)
const handler = createHandlerWithMiddleware.admin('/api/admin/users', {
  requiredRoles: ['payez_admin']  // Requires payez_admin role
});
```

---

## Troubleshooting

### Common Issues

#### Issue: "Token does not have merchant role"
**Cause**: User with PayEz admin roles trying to access merchant endpoint  
**Solution**: Use admin-specific endpoints or add merchant role to user  

#### Issue: "Token does not have any payez_ roles"  
**Cause**: Corporate user trying to access PayEz admin resources  
**Solution**: Grant appropriate payez_ role or use corporate endpoints  

#### Issue: "Token does not have any corporate roles"
**Cause**: User from company application (Cryptaply, etc.) with only basic roles trying to access corporate resources  
**Solution**: Grant appropriate corporate role for the company application

### Debugging Token Classification

Use logging to debug token type determination:

```csharp
_logger.Information("Token type determined: {TokenType}, Key type: {KeyType}", tokenType, requiredKeyType);
```

Check user roles in session:
```json
{
  "userId": "jon.ranes@payez.net",
  "roles": ["payez_admin", "payez_user"],
  "tokenType": "ExternalIdp"  // Expected classification
}
```

---

## Migration Notes

### Previous Implementation
- Token type was determined by **audience** instead of **roles**
- Limited flexibility for new role types
- Could cause misclassification of admin users

### Current Implementation  
- Token type determined by **role analysis**
- Priority-based classification prevents privilege escalation
- Flexible role prefix system allows new admin roles
- Backward compatible with existing corporate roles

### Breaking Changes
- Users with PayEz admin roles now classified as ExternalIdp instead of Corporate
- Merchant role takes absolute priority over other roles
- Audience validation enforced more strictly

---

## API Reference

### DetermineTokenTypeAndKey Method

```csharp
/// <summary>
/// Determines the token type and signing key based on user roles
/// </summary>
/// <param name="principal">Claims principal containing user roles</param>
/// <returns>Tuple containing token type and signing key type</returns>
private (TokenValidationType type, TokenSigningKeyType keyType) DetermineTokenTypeAndKey(ClaimsPrincipal principal)
```

### ValidateTokenClaims Method

```csharp
/// <summary>
/// Validates token claims based on determined token type
/// </summary>
/// <param name="result">Token validation result containing claims</param>
/// <param name="tokenType">Determined token type</param>
/// <param name="error">Output error message if validation fails</param>
/// <returns>True if validation passes, false otherwise</returns>
private bool ValidateTokenClaims(IdentityTokenValidationResponse result, TokenValidationType tokenType, out string error)
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | July 2025 | Initial role-based token type system implementation |
| | | - Role-based determination instead of audience-based |
| | | - Priority system for token classification |
| | | - PayEz admin role support with "payez_" prefix |

---

**Document Maintained By**: PayEz Infrastructure Team  
**Contact**: For questions about token validation, check the friggen logs! 🔥
