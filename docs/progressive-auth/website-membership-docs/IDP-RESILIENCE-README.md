# IDP Resilience Strategy - Complete Implementation

This document outlines a comprehensive resilience strategy to handle Identity Provider (IDP) outages gracefully while maintaining service availability and user experience.

## 🎯 Problem Statement

When the IDP is unavailable (e.g., ECONNREFUSED), users with expired access tokens but valid refresh tokens experience:
- Authentication loops (repeated failed refresh attempts)
- Forced logout/redirects to login
- Complete service unavailability
- Poor user experience during temporary outages

## 🏗️ Architecture Overview

The solution implements a multi-layered resilience strategy:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT SIDE                              │
├─────────────────────────────────────────────────────────────┤
│  • React Hook (useServiceHealth)                            │
│  • Automatic degraded mode detection                        │
│  • UI adaptations (disable write operations)               │
│  • User notifications and retry mechanisms                  │
└─────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────┐
│                    API LAYER                                │
├─────────────────────────────────────────────────────────────┤
│  • API Resilience Middleware                               │
│  • Centralized degraded mode handling                      │
│  • Operation-based access control                          │
│  • Clear error responses with degradation info             │
└─────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────┐
│                 TOKEN MANAGEMENT                            │
├─────────────────────────────────────────────────────────────┤
│  • Circuit Breaker Pattern                                 │
│  • Token Synchronization with fallback                     │
│  • Session persistence in degraded mode                    │
│  • Automatic service outage detection                      │
└─────────────────────────────────────────────────────────────┘
                                ↕
┌─────────────────────────────────────────────────────────────┐
│                 SESSION STORAGE                             │
├─────────────────────────────────────────────────────────────┤
│  • Redis-backed session management                         │
│  • Degraded mode flags and metadata                        │
│  • Extended token validity during outages                  │
│  • Type-safe session models                                │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Core Components

### 1. Circuit Breaker (`src/lib/circuit-breaker.ts`)

Implements the circuit breaker pattern to detect IDP outages and prevent cascading failures:

- **CLOSED**: Normal operation, requests allowed
- **OPEN**: Service failing, requests blocked with immediate fallback
- **HALF_OPEN**: Testing recovery, limited requests allowed

**Key Features:**
- Configurable failure thresholds and recovery timeouts
- Redis-backed state persistence across instances
- Automatic failure detection and recovery testing
- Detailed metrics and logging

```typescript
import { idpCircuitBreaker, withCircuitBreaker } from '@/lib/circuit-breaker';

// Use circuit breaker for IDP operations
const result = await withCircuitBreaker(
  () => refreshTokenWithRetry(refreshToken),
  'Token refresh'
);
```

### 2. Token Synchronization (`src/lib/token-sync.ts`)

Enhanced token management with graceful degradation:

- **Service Outage Detection**: Distinguishes IDP outages from auth failures
- **Degraded Mode Sessions**: Creates extended validity sessions when IDP is unavailable
- **Circuit Breaker Integration**: Uses circuit breaker to avoid unnecessary IDP calls
- **Atomic Operations**: Ensures consistent token state across Redis and sessions

**Degraded Mode Behavior:**
- Extends current access token validity by 30 minutes
- Sets degraded mode flags in session
- Removes refresh token (prevents further failed attempts)
- Maintains read-only access to cached data

### 3. Session Model (`src/models/SessionModel.ts`)

Extended session model with degraded mode support:

```typescript
interface SessionData {
  // ... existing fields
  isDegradedMode?: boolean;
  degradedReason?: string;
}

class SessionModel {
  // ... existing methods
  isDegraded(): boolean;
  getDegradedReason(): string | undefined;
}
```

### 4. API Resilience Middleware (`src/middleware/api-resilience.ts`)

Centralized middleware for all API routes:

- **Automatic Degraded Mode Detection**: Checks session and circuit breaker state
- **Operation-based Access Control**: Allows read operations, blocks writes during outages
- **Token Consistency**: Ensures fresh tokens with fallback to degraded mode
- **Clear Error Responses**: Provides structured error responses with degradation info

```typescript
import { withResilienceWrapper } from '@/middleware/api-resilience';

export const GET = withResilienceWrapper(
  async (req, { userId, sessionToken, isDegradedMode }) => {
    // Handler logic - degraded mode is automatically handled
    return NextResponse.json({ data: "response" });
  },
  {
    allowDegradedMode: true,      // Allow in degraded mode
    allowReadOnlyInDegraded: true, // This is a read operation
    requireFreshToken: false       // Don't require fresh token
  }
);
```

### 5. Client-Side Health Management (`src/hooks/useServiceHealth.ts`)

React hook for client-side resilience:

- **Automatic Health Monitoring**: Periodic health checks and degraded mode detection
- **UI State Management**: Manages degraded mode state and user notifications
- **Response Header Detection**: Automatically detects degraded mode from API responses
- **Operation Capabilities**: Provides hooks to check if operations are allowed

```typescript
import { useServiceHealth, useOperationCapabilities } from '@/hooks/useServiceHealth';

function MyComponent() {
  const { health, showNotice, acknowledgeNotice } = useServiceHealth();
  const { canWrite, getMessage } = useOperationCapabilities();
  
  return (
    <div>
      {showNotice && (
        <DegradedModeNotice 
          message={getMessage()} 
          onAcknowledge={acknowledgeNotice} 
        />
      )}
      
      <button disabled={!canWrite}>
        Save Changes
      </button>
    </div>
  );
}
```

## 🔄 Flow Diagrams

### Normal Operation Flow
```
User Request → API Middleware → Token Check → Fresh Token? → API Handler → Response
                     ↓              ↓            ↓
                Circuit Check → IDP Refresh → Update Session
```

### Degraded Mode Flow (IDP Down)
```
User Request → API Middleware → Token Check → Expired Token → Circuit Breaker OPEN
                     ↓              ↓             ↓                    ↓
                Degraded Check → Create Degraded Session → Extended Validity
                     ↓                           ↓                    ↓
             Read-Only Check → Allow Read/Block Write → Response with Headers
```

### Recovery Flow
```
Circuit Breaker HALF_OPEN → Test Request → Success? → Circuit CLOSED
          ↓                        ↓           ↓            ↓
    Limited Requests → IDP Available → Clear Degraded → Normal Operation
```

## 🚨 Error Handling Strategy

### Error Classification

1. **Service Outage Errors** (trigger degraded mode):
   - `ECONNREFUSED`
   - `IDP_SERVICE_UNAVAILABLE`
   - `IDP_REQUEST_TIMEOUT`
   - `fetch failed`
   - HTTP 5xx responses

2. **Authentication Errors** (require re-authentication):
   - Invalid credentials
   - Revoked tokens
   - Permission denied

3. **Circuit Breaker Errors**:
   - `CIRCUIT_BREAKER_OPEN`
   - Immediate fallback without IDP call

### Response Structure

```typescript
// Normal Error Response
{
  "error": "Token validation failed",
  "code": "TOKEN_VALIDATION_FAILED"
}

// Degraded Mode Response
{
  "error": "Write operations unavailable",
  "code": "WRITE_DISABLED_DEGRADED",
  "degraded": {
    "mode": true,
    "reason": "IDP_UNAVAILABLE",
    "readOnly": true
  }
}

// Headers
X-Service-Degraded: true
X-Service-Degraded-Reason: IDP_UNAVAILABLE
X-Service-Read-Only: true
```

## 📊 Monitoring and Observability

### Health Check Endpoint (`/api/health`)

Provides comprehensive service health information:

```json
{
  "status": "degraded",
  "timestamp": "2024-01-15T10:30:00Z",
  "services": {
    "idp": {
      "status": "unhealthy",
      "circuitBreaker": {
        "state": "OPEN",
        "failures": 5,
        "nextAttempt": "2024-01-15T10:31:00Z"
      }
    },
    "redis": {
      "status": "healthy",
      "latencyMs": 12
    }
  },
  "degradedMode": {
    "active": true,
    "reason": "IDP_UNAVAILABLE",
    "capabilities": {
      "authentication": true,
      "readOperations": true,
      "writeOperations": false
    }
  }
}
```

### Logging Strategy

All components use structured logging with:
- **Correlation IDs**: Track requests across services
- **Degraded Mode Markers**: Clear identification of degraded operations
- **Circuit Breaker Events**: State transitions and recovery attempts
- **Token Refresh Activities**: Success/failure rates and patterns

### Metrics to Monitor

1. **Circuit Breaker Metrics**:
   - State transitions (CLOSED→OPEN→HALF_OPEN→CLOSED)
   - Failure rate and recovery success rate
   - Time in each state

2. **Degraded Mode Metrics**:
   - Sessions in degraded mode
   - Duration of degraded mode episodes
   - Read vs write request success rates

3. **Token Management Metrics**:
   - Token refresh success/failure rates
   - Degraded mode session creation rate
   - Session consistency check results

## 🛠️ Configuration

### Circuit Breaker Configuration

```typescript
const circuitBreakerConfig = {
  failureThreshold: 3,         // Open after 3 failures
  recoveryTimeout: 30 * 1000,  // Try recovery after 30 seconds
  monitorWindow: 60 * 1000,    // Monitor failures over 1 minute
  successThreshold: 2          // Close after 2 successful calls
};
```

### Token Sync Configuration

```typescript
const tokenSyncConfig = {
  freshnesThreshold: 60 * 1000,    // 1 minute before refresh
  degradedExtension: 30 * 60 * 1000, // 30 minutes extension
  lockTTL: 30,                      // 30 seconds lock timeout
};
```

## 🔐 Security Considerations

### Degraded Mode Security

1. **Extended Token Validity**: Only extends existing valid tokens, never creates new ones
2. **Read-Only Access**: Write operations blocked to prevent data inconsistency
3. **Limited Duration**: Degraded sessions have maximum lifetime limits
4. **Audit Logging**: All degraded mode operations are logged for security review

### Token Management Security

1. **Single-Use Refresh Tokens**: Prevents replay attacks
2. **Atomic Updates**: Ensures consistent state across storage layers
3. **Version Control**: Prevents race conditions and token conflicts
4. **Distributed Locks**: Ensures only one refresh per user at a time

## 🚀 Deployment and Operations

### Rollout Strategy

1. **Phase 1**: Deploy circuit breaker and monitoring (no behavior changes)
2. **Phase 2**: Enable degraded mode for read operations only
3. **Phase 3**: Full degraded mode with write operation blocking
4. **Phase 4**: Client-side health management and UI adaptations

### Operational Procedures

#### During IDP Outage
1. Monitor circuit breaker state via health endpoints
2. Verify degraded mode is functioning (read operations work)
3. Communicate service status to users
4. Monitor for recovery and circuit breaker state transitions

#### Recovery Verification
1. Check circuit breaker transitions to CLOSED state
2. Verify normal token refresh operations resume
3. Monitor degraded mode session cleanup
4. Validate full service functionality

#### Manual Intervention
- **Circuit Breaker Reset**: `POST /api/admin/circuit-breaker/reset`
- **Force Health Check**: `POST /api/admin/health/refresh`
- **Clear Degraded Sessions**: `POST /api/admin/sessions/clear-degraded`

## 🧪 Testing Strategy

### Unit Tests
- Circuit breaker state transitions
- Token sync degraded mode logic
- Session model degraded mode methods
- API middleware resilience logic

### Integration Tests
- End-to-end degraded mode flows
- Circuit breaker integration with token refresh
- API responses during simulated outages
- Client-side health management

### Load Tests
- Circuit breaker behavior under high failure rates
- Degraded mode performance with many sessions
- Redis performance during outage recovery
- Session cleanup after recovery

### Chaos Testing
- Simulate IDP outages during peak traffic
- Test partial IDP failures (slow responses)
- Verify graceful degradation under various failure modes
- Test recovery scenarios with different traffic patterns

## 📈 Success Metrics

### User Experience Metrics
- **Reduced Authentication Loops**: 95% reduction in forced logouts during IDP outages
- **Service Availability**: >99% read operation availability during IDP outages
- **User Retention**: <5% user drop-off during degraded mode
- **Recovery Time**: <2 minutes to restore full functionality after IDP recovery

### Technical Metrics
- **Circuit Breaker Effectiveness**: >90% of IDP failures detected within 3 attempts
- **Degraded Mode Adoption**: >95% of sessions successfully transition to degraded mode
- **Token Consistency**: 100% consistency between degraded sessions and Redis
- **Monitoring Coverage**: 100% of degraded mode operations logged and tracked

## 🔍 Troubleshooting Guide

### Common Issues

#### Circuit Breaker Not Opening
- Check failure threshold configuration
- Verify error detection logic for your IDP
- Review error classification in `isIDPServiceOutage()`

#### Degraded Mode Not Activating
- Verify session model has degraded mode fields
- Check API middleware configuration
- Review token sync degraded mode creation

#### Client Not Detecting Degraded Mode
- Verify response headers are being set
- Check health check endpoint functionality
- Review client-side response header detection

#### Sessions Not Recovering
- Check circuit breaker recovery logic
- Verify session cleanup after IDP recovery
- Review token refresh retry mechanisms

### Debugging Tools

1. **Health Check Dashboard**: Monitor real-time service health
2. **Circuit Breaker Metrics**: View state transitions and failure patterns
3. **Session Inspector**: Debug degraded mode session states
4. **Token Sync Logs**: Trace token refresh and degraded mode logic

This comprehensive resilience strategy ensures your application maintains high availability and excellent user experience even during Identity Provider outages, while providing clear monitoring, debugging, and operational procedures for maintaining the system.
