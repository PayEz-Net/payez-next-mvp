# IDP Resilience Strategy

## Problem
When IDP is down during token refresh, the application spirals into chaos:
- Redirects to login even though user has valid session
- Creates authentication loops 
- Terrible user experience

## Solution: Multi-Layer Fallback Strategy

### 1. Circuit Breaker Enhancement
```typescript
class IDPCircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private failureCount = 0
  private lastFailureTime = 0
  
  async executeWithFallback<T>(
    operation: () => Promise<T>,
    fallback: () => Promise<T>
  ): Promise<T> {
    if (this.state === 'OPEN') {
      // IDP is down - use fallback immediately
      return await fallback()
    }
    
    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      if (this.isConnectionError(error)) {
        // IDP is down - use fallback
        return await fallback()
      }
      throw error
    }
  }
}
```

### 2. Session Persistence Strategy
```typescript
// When IDP is down, use cached session data
interface CachedSession {
  userId: string
  email: string
  roles: string[]
  lastValidated: Date
  bearerToken: string
  refreshToken: string
  isDegraded: boolean  // Flag for degraded mode
}

async function getSessionWithFallback(sessionToken: string): Promise<AppSession> {
  try {
    // Try normal flow first
    return await refreshTokensFromIDP(sessionToken)
  } catch (error) {
    if (isIDPConnectionError(error)) {
      // IDP is down - use cached session in degraded mode
      const cached = await getCachedSession(sessionToken)
      return {
        ...cached,
        isDegraded: true,
        degradedReason: 'IDP_UNAVAILABLE'
      }
    }
    throw error
  }
}
```

### 3. API Handler Resilience
```typescript
// In API handlers - fail gracefully instead of rejecting auth
export const createResilientHandler = () => {
  return async (req: NextRequest) => {
    try {
      const session = await getSessionWithFallback(sessionToken)
      
      if (session.isDegraded) {
        // Allow read-only operations in degraded mode
        if (req.method === 'GET') {
          return handleRequestWithWarning(req, session, 'Service temporarily degraded')
        } else {
          return Response.json({
            error: 'Service temporarily unavailable for write operations',
            canRetry: true
          }, { status: 503 })
        }
      }
      
      return handleNormalRequest(req, session)
    } catch (error) {
      // Only redirect to login for true auth failures, not service outages
      if (isAuthenticationError(error)) {
        return Response.redirect('/account-auth/login')
      } else {
        return Response.json({
          error: 'Service temporarily unavailable',
          canRetry: true
        }, { status: 503 })
      }
    }
  }
}
```

### 4. Frontend Graceful Handling
```typescript
// In directory client - show degraded mode instead of chaos
const DirectoryClient = () => {
  const [serviceStatus, setServiceStatus] = useState<'normal' | 'degraded' | 'unavailable'>('normal')
  
  useEffect(() => {
    const checkServiceHealth = async () => {
      try {
        await clientApi.get('/api/health/idp', accessToken)
        setServiceStatus('normal')
      } catch (error) {
        if (error.status === 503) {
          setServiceStatus('degraded')
        } else {
          setServiceStatus('unavailable')  
        }
      }
    }
    
    checkServiceHealth()
  }, [])
  
  if (serviceStatus === 'unavailable') {
    return <ServiceUnavailableMessage />
  }
  
  return (
    <>
      {serviceStatus === 'degraded' && <DegradedModeWarning />}
      <UserDirectoryGrid readOnly={serviceStatus === 'degraded'} />
    </>
  )
}
```

### 5. User-Facing Components
```jsx
const ServiceUnavailableMessage = () => (
  <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-6">
    <div className="flex items-center space-x-3">
      <AlertTriangle className="h-6 w-6 text-yellow-400" />
      <div>
        <h3 className="text-lg font-medium text-yellow-200">
          Service Temporarily Unavailable
        </h3>
        <p className="text-yellow-300 mt-1">
          We're experiencing connectivity issues. Your session is still valid.
          Please try again in a few moments.
        </p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-3 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded"
        >
          Try Again
        </button>
      </div>
    </div>
  </div>
)

const DegradedModeWarning = () => (
  <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 mb-4">
    <div className="flex items-center space-x-2">
      <Info className="h-4 w-4 text-blue-400" />
      <span className="text-sm text-blue-300">
        Running in read-only mode due to temporary service issues.
        Some features may be limited.
      </span>
    </div>
  </div>
)
```

## Key Principles

1. **Never redirect to login for service outages** - only for true auth failures
2. **Use cached session data** when IDP is unreachable  
3. **Provide clear user feedback** about degraded state
4. **Allow read operations** even when IDP is down
5. **Fail fast with helpful messages** instead of retry loops
6. **Distinguish between auth failures and service outages**

## Benefits

- ✅ User keeps working (read-only) even when IDP is down
- ✅ Clear feedback about service state  
- ✅ No authentication chaos loops
- ✅ Graceful degradation instead of total failure
- ✅ Automatic recovery when service returns
