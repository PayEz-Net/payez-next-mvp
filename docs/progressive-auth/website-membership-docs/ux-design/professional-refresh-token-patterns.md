# Professional Single-Use Refresh Token Patterns

## 🏆 Professional Single-Use Refresh Token Patterns

### 1. **Request Queuing Pattern** (Most Common)
```typescript
class RefreshTokenManager {
  private refreshPromise: Promise<TokenRefreshResult> | null = null;
  private refreshQueue: Array<{resolve: Function, reject: Function}> = [];

  async refreshToken(token: string): Promise<TokenRefreshResult> {
    // If refresh is already in progress, queue this request
    if (this.refreshPromise) {
      return new Promise((resolve, reject) => {
        this.refreshQueue.push({ resolve, reject });
      });
    }

    // Start the refresh process
    this.refreshPromise = this.performRefresh(token);
    
    try {
      const result = await this.refreshPromise;
      
      // Notify all queued requests of success
      this.refreshQueue.forEach(({resolve}) => resolve(result));
      this.refreshQueue = [];
      
      return result;
    } catch (error) {
      // Notify all queued requests of failure
      this.refreshQueue.forEach(({reject}) => reject(error));
      this.refreshQueue = [];
      
      throw error;
    } finally {
      this.refreshPromise = null;
    }
  }
}
```

### 2. **Timeout + Graceful Degradation** (Your Idea!)
```typescript
async performRefresh(token: string): Promise<TokenRefreshResult> {
  const REFRESH_TIMEOUT = 90000; // 90 seconds
  
  const refreshPromise = fetch('/api/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken: token }),
    headers: { 'Content-Type': 'application/json' }
  });

  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('REFRESH_TIMEOUT')), REFRESH_TIMEOUT);
  });

  try {
    const response = await Promise.race([refreshPromise, timeoutPromise]);
    return await response.json();
  } catch (error) {
    if (error.message === 'REFRESH_TIMEOUT') {
      // Show "Connection interrupted" page
      this.showConnectionInterruptedPage();
    }
    throw error;
  }
}
```

### 3. **Connection Interrupted Page** (UX Best Practice)
```tsx
const ConnectionInterruptedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center justify-center w-12 h-12 mx-auto bg-yellow-100 rounded-full">
        <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
      </div>
      
      <h1 className="mt-4 text-xl font-semibold text-center text-gray-900">
        Connection Interrupted
      </h1>
      
      <p className="mt-2 text-sm text-center text-gray-600">
        We're having trouble refreshing your session. This might be due to a slow connection or server issue.
      </p>
      
      <div className="mt-6 flex flex-col gap-3">
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Try Again
        </button>
        
        <button 
          onClick={() => signOut({ callbackUrl: '/account-auth/login' })}
          className="w-full bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
        >
          Sign In Again
        </button>
      </div>
      
      <p className="mt-4 text-xs text-center text-gray-500">
        If this continues, try clearing your browser cache or contact support.
      </p>
    </div>
  </div>
);
```

## 🎯 Complete Professional Implementation

### 4. **Redis-Based Coordination** (Enterprise Pattern)
```typescript
export class EnterpriseRefreshManager {
  private readonly REFRESH_LOCK_TTL = 90; // 90 seconds
  private readonly REFRESH_RESULT_TTL = 30; // 30 seconds to share result
  
  async refreshToken(refreshToken: string): Promise<TokenRefreshResult> {
    const tokenHash = this.hashToken(refreshToken);
    const lockKey = `refresh_lock:${tokenHash}`;
    const resultKey = `refresh_result:${tokenHash}`;
    
    // Try to acquire lock
    const acquired = await redis.set(lockKey, 'locked', 'EX', this.REFRESH_LOCK_TTL, 'NX');
    
    if (acquired === 'OK') {
      // We got the lock - perform the refresh
      try {
        const result = await this.performActualRefresh(refreshToken);
        
        // Store result for other waiting requests
        await redis.setex(resultKey, this.REFRESH_RESULT_TTL, JSON.stringify(result));
        
        return result;
      } finally {
        await redis.del(lockKey);
      }
    } else {
      // Another request is refreshing - wait for result
      return this.waitForRefreshResult(resultKey);
    }
  }
  
  private async waitForRefreshResult(resultKey: string): Promise<TokenRefreshResult> {
    const maxWaitTime = 90000; // 90 seconds
    const pollInterval = 1000; // 1 second
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      const result = await redis.get(resultKey);
      if (result) {
        return JSON.parse(result);
      }
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error('REFRESH_TIMEOUT');
  }
}
```

### 5. **Circuit Breaker Pattern** (Production Resilience)
```typescript
export class RefreshCircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private readonly failureThreshold = 3;
  private readonly recoveryTimeout = 30000; // 30 seconds
  
  async refreshWithCircuitBreaker(token: string): Promise<TokenRefreshResult> {
    // Check if circuit is open
    if (this.isCircuitOpen()) {
      throw new Error('CIRCUIT_OPEN');
    }
    
    try {
      const result = await this.performRefresh(token);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private isCircuitOpen(): boolean {
    if (this.failures >= this.failureThreshold) {
      if (Date.now() - this.lastFailureTime > this.recoveryTimeout) {
        this.failures = 0; // Reset after recovery timeout
        return false;
      }
      return true;
    }
    return false;
  }
  
  private onSuccess(): void {
    this.failures = 0;
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
  }
}
```

### 6. **User Experience States**
```tsx
export enum RefreshState {
  IDLE = 'idle',
  REFRESHING = 'refreshing',
  TIMEOUT = 'timeout',
  FAILED = 'failed',
  SUCCESS = 'success'
}

export const RefreshStateHandler = () => {
  const [state, setState] = useState<RefreshState>(RefreshState.IDLE);
  
  useEffect(() => {
    switch (state) {
      case RefreshState.REFRESHING:
        // Show subtle loading indicator
        break;
      case RefreshState.TIMEOUT:
        // Show connection interrupted page
        break;
      case RefreshState.FAILED:
        // Show retry options
        break;
      case RefreshState.SUCCESS:
        // Continue with app
        break;
    }
  }, [state]);
};
```

## 🔧 Implementation Priority

1. **Phase 1**: Request queuing + timeout (your idea)
2. **Phase 2**: Connection interrupted UX
3. **Phase 3**: Redis coordination for true enterprise scale
4. **Phase 4**: Circuit breaker for resilience

## 📋 Best Practices Summary

- **Never retry with same refresh token** ✅
- **Queue concurrent requests** ✅ 
- **90-second timeout is perfect** ✅
- **Graceful fallback to login** ✅
- **User-friendly error messages** ✅
- **Clear "try again" options** ✅

Your instincts are spot-on for JWT auth! This is exactly how professionals handle single-use refresh tokens.
