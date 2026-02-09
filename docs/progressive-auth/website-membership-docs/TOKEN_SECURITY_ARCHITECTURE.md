# Token Security Architecture

## Overview

This document outlines the security improvements implemented in the authentication system by moving refresh tokens from client-side JWT sessions to server-side Redis storage.

## Architecture Change

### Before: Client-Side Token Storage
```
Client Browser
├── JWT Session (localStorage/cookies)
│   ├── Access Token
│   ├── Refresh Token ❌ (exposed)
│   └── Session Data
└── Redis Session
    ├── User Info
    ├── 2FA State
    └── Session Metadata
```

### After: Server-Side Token Storage
```
Client Browser
├── JWT Session (localStorage/cookies)
│   ├── Session Token (UUID)
│   └── Session Metadata
└── Redis Session
    ├── User Info
    ├── Access Token ✅ (server-side)
    ├── Refresh Token ✅ (server-side)
    ├── Token Expiry
    └── 2FA State
```

## Security Benefits

### 1. Client-Side Token Exposure Eliminated

**Before:**
- Refresh tokens stored in JWT session
- Accessible in browser dev tools, localStorage, cookies
- Visible in network requests and browser storage

**After:**
- Refresh tokens only exist server-side in Redis
- Completely hidden from client-side code
- No token exposure in browser storage or network requests

### 2. Token Theft Prevention

**Before:**
- If JWT session is compromised, attacker gets both access AND refresh tokens
- Single point of failure exposes all authentication data

**After:**
- Even if client-side session is compromised, refresh token remains secure
- Access token compromise doesn't automatically expose refresh token
- Defense in depth with multiple layers of protection

### 3. Centralized Token Management

**Before:**
- Tokens scattered across client devices
- Difficult to invalidate or manage sessions
- No server-side control over token lifecycle

**After:**
- All tokens centralized in Redis
- Instant session invalidation capability
- Server controls token lifecycle and rotation

### 4. Enhanced Session Control

**Before:**
- Client controls token lifecycle
- Limited ability to force logout or session management
- No server-side session oversight

**After:**
- Server controls token lifecycle
- Can force logout, rotate tokens, implement session policies
- Full control over authentication state

### 5. Audit and Monitoring

**Before:**
- No visibility into token usage patterns
- Difficult to detect suspicious activity
- Limited audit trail

**After:**
- Can log and monitor token refresh patterns
- Detect anomalies and suspicious activity
- Complete audit trail of authentication events

## Implementation Details

### Token Storage in Redis

```typescript
interface SessionData {
  userId: string;
  email: string;
  roles: string[];
  twoFactorComplete: boolean;
  accessToken?: string;        // Server-side only
  refreshToken?: string;       // Server-side only
  accessTokenExpires?: number; // Server-side only
}
```

### JWT Callback Flow

1. **Read from Redis**: JWT callback reads tokens from Redis session
2. **Update on Refresh**: When tokens are refreshed, update Redis with new tokens
3. **Client Isolation**: Client only receives session token, never sees actual tokens

### Token Refresh Process

1. **Client Request**: Client makes authenticated request
2. **JWT Callback**: Reads current tokens from Redis
3. **Token Validation**: Checks if access token is expired
4. **Refresh if Needed**: Uses refresh token from Redis to get new tokens from IDP
5. **Update Redis**: Stores new tokens in Redis
6. **Return Updated Token**: Returns new access token to client

## Additional Security Features

### Token Rotation
- Can implement automatic refresh token rotation
- No client involvement required
- Enhanced security through token lifecycle management

### Session Invalidation
- Instant session invalidation for security incidents
- Geographic restrictions and device fingerprinting
- Granular session control and monitoring

### Monitoring and Alerting
- Real-time monitoring of token usage patterns
- Anomaly detection for suspicious activity
- Comprehensive audit logging

## Best Practices

### 1. Token Expiry Management
- Set appropriate expiry times for both access and refresh tokens
- Implement automatic token rotation
- Monitor token usage patterns

### 2. Session Security
- Use secure session tokens (UUIDs)
- Implement session timeout policies
- Regular session cleanup and maintenance

### 3. Monitoring and Alerting
- Log all token refresh events
- Monitor for unusual patterns
- Implement alerting for security events

### 4. Error Handling
- Graceful handling of token refresh failures
- Proper error responses without exposing sensitive information
- Fallback mechanisms for service disruptions

## Conclusion

Moving refresh tokens to server-side Redis storage significantly improves the security posture of the authentication system by:

- Eliminating client-side token exposure
- Providing centralized token management
- Enabling enhanced session control and monitoring
- Following security best practices for token handling

This architecture follows the principle of "never trust the client" and ensures sensitive authentication tokens remain secure on the server where they belong.

## Temporary Verification Tokens for 2FA

### Overview
The 2FA flow utilizes temporary verification tokens to securely complete two-factor authentication. These tokens provide an additional layer of security by ensuring that 2FA verification is tied directly to the user's session and requires frontend confirmation before marking 2FA as complete.

### Architecture
```
2FA Verification Flow
├── SMS Code Verification
│   ├── User enters SMS code
│   ├── /api/account/verify-sms validates code with IDP
│   └── Returns temporary verification token
├── Temporary Token Generation
│   ├── Cryptographically random 64-character hex token
│   ├── Stored in Redis with 5-minute TTL
│   ├── Tied to session token + user ID + method
│   └── Single-use consumption
└── 2FA Completion
    ├── Frontend receives temp token
    ├── Calls /api/account/complete-2fa with token
    ├── Validates token matches session
    └── Marks session as 2FA complete
```

### Security Properties

#### 1. Session Binding
- Each temp token is cryptographically tied to the specific session
- Prevents token replay across different sessions
- Ensures 2FA completion occurs within the correct user context

#### 2. Time-Limited Validity
- 5-minute TTL prevents long-term token exposure
- Automatic expiration reduces attack window
- Forces timely completion of 2FA flow

#### 3. Single-Use Consumption
- Tokens are consumed upon successful validation
- Prevents replay attacks with the same token
- Ensures one-time verification per attempt

#### 4. Frontend Confirmation Requirement
- 2FA verification does not immediately complete authentication
- Requires explicit frontend confirmation via temp token
- Prevents race conditions and ensures user awareness

### Implementation Details

#### Token Generation
```typescript
interface TempVerificationToken {
  token: string;           // 64-char hex random value
  sessionToken: string;    // Associated session UUID
  userId: string;          // User identifier
  method: string;          // Verification method (sms/email)
  createdAt: number;       // Creation timestamp
  ttl: number;             // Time-to-live in seconds (300)
}
```

#### Storage Pattern
```
Redis Key: temp_token:{token}
Value: JSON serialized token data
Expiry: 300 seconds (5 minutes)
```

#### Validation Process
1. **Token Lookup**: Retrieve token data from Redis
2. **Session Verification**: Ensure token belongs to current session
3. **User Verification**: Confirm token belongs to current user
4. **Method Verification**: Validate verification method matches
5. **Expiry Check**: Ensure token hasn't expired
6. **Consumption**: Delete token to prevent reuse
7. **Session Update**: Mark session as 2FA complete

### API Endpoints

#### SMS Verification: `/api/account/verify-sms`
- Validates SMS code with IDP
- Generates and returns temporary verification token
- Does NOT mark 2FA as complete

#### 2FA Completion: `/api/account/complete-2fa`
- Accepts temporary verification token
- Validates token against session
- Marks session as 2FA complete on success
- Updates Redis session state

### Security Benefits

#### 1. Decoupled Verification
- Separates code verification from session state change
- Prevents premature 2FA completion
- Allows for additional validation steps

#### 2. Replay Attack Prevention
- Single-use tokens prevent replay attacks
- Session binding prevents cross-session attacks
- Time limits reduce exposure window

#### 3. Enhanced Audit Trail
- Complete logging of 2FA verification steps
- Trackable token generation and consumption
- Clear separation of verification vs. completion events

#### 4. Frontend Security
- Requires explicit frontend participation
- Prevents background 2FA completion
- Ensures user awareness and consent

### Token Lifecycle

1. **Creation**: Generated upon successful SMS verification
2. **Storage**: Stored in Redis with TTL
3. **Transmission**: Returned to frontend in API response
4. **Validation**: Verified against session and user context
5. **Consumption**: Deleted upon successful validation
6. **Expiration**: Automatically removed after TTL

### Error Handling

#### Invalid Token
- Returns `INVALID_2FA_TOKEN` error code
- Does not reveal token existence or validity
- Requires new 2FA verification attempt

#### Expired Token
- Treated as invalid token
- Requires fresh SMS verification
- Automatic cleanup from Redis

#### Session Mismatch
- Returns `INVALID_SESSION` error code
- Prevents cross-session token usage
- Forces proper authentication flow

### Best Practices

#### 1. Token Security
- Use cryptographically secure random generation
- Implement proper TTL management
- Ensure single-use consumption

#### 2. Session Validation
- Always validate session context
- Verify user identity consistency
- Check method appropriateness

#### 3. Error Responses
- Avoid revealing token existence
- Use consistent error messages
- Log security events appropriately

#### 4. Monitoring
- Track token generation rates
- Monitor completion success rates
- Alert on suspicious patterns

This temporary verification token pattern ensures that 2FA completion is both secure and user-controlled, preventing premature authentication state changes while maintaining a smooth user experience.
