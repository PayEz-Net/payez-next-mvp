# Circuit Breaker Recovery Detection Enhancement

## Overview

The circuit breaker has been enhanced with a sophisticated recovery detection mechanism that includes a "half-open" state for testing service recovery. This implementation follows the standard circuit breaker pattern with improved recovery logic.

## States

### 1. CLOSED State
- **Behavior**: All requests are allowed to pass through
- **Transition**: Moves to OPEN after reaching the failure threshold (2 failures)
- **Characteristics**: Normal operation mode

### 2. OPEN State  
- **Behavior**: All requests are blocked
- **Transition**: Moves to HALF_OPEN after recovery time expires
- **Characteristics**: Service is considered unavailable
- **Recovery Time**: Initially 30 seconds, extends with exponential backoff on test failures

### 3. HALF_OPEN State
- **Behavior**: Allows exactly one test request, blocks all others
- **Transition**: 
  - To CLOSED on successful test request
  - To OPEN on failed test request (with extended recovery time)
- **Characteristics**: Testing phase to determine if service has recovered

## Key Features

### Recovery Detection
- **Automatic Transition**: Circuit automatically transitions from OPEN to HALF_OPEN after recovery time
- **Single Test Request**: Only one request is allowed during the half-open phase
- **Test Request Tracking**: `testRequestInProgress` flag prevents concurrent test requests

### Exponential Backoff
- **Initial Recovery Time**: 30 seconds
- **Backoff Multiplier**: 2x on each test failure
- **Maximum Recovery Time**: 5 minutes (300 seconds)
- **Example**: 30s → 60s → 120s → 240s → 300s (max)

### Comprehensive Logging
All state transitions are logged with detailed information:
- Circuit initialization
- State transitions (CLOSED → OPEN → HALF_OPEN → CLOSED)
- Test request allowance in HALF_OPEN state
- Success/failure outcomes with recovery time information

## API Changes

### New Properties in CircuitBreakerState
```typescript
interface CircuitBreakerState {
  failures: number;
  lastFailure: number;
  isOpen: boolean; // Kept for backward compatibility
  state: CircuitBreakerStateType; // NEW: Current state
  recoveryTime: number; // NEW: Dynamic recovery time
  testRequestInProgress: boolean; // NEW: Test request tracking
}
```

### New Helper Functions
- `getCircuitBreakerStateName()`: Get current state as string
- `isCircuitBreakerOpen()`: Check if circuit is in OPEN state
- `isCircuitBreakerHalfOpen()`: Check if circuit is in HALF_OPEN state
- `isCircuitBreakerClosed()`: Check if circuit is in CLOSED state
- `resetCircuitBreaker()`: Manually reset circuit to CLOSED state

## Usage Examples

### Basic State Checking
```typescript
import { 
  isCircuitBreakerClosed,
  isCircuitBreakerHalfOpen,
  canAttemptRefresh 
} from '@/utils/circuitBreaker';

// Check if service is available
if (isCircuitBreakerClosed()) {
  // Normal operation
  await callService();
} else if (isCircuitBreakerHalfOpen() && canAttemptRefresh()) {
  // Test request allowed
  await testServiceRecovery();
}
```

### Monitoring Circuit State
```typescript
import { getCircuitBreakerState } from '@/utils/circuitBreaker';

const state = getCircuitBreakerState();
console.log(`Circuit is ${state.state}, recovery time: ${state.recoveryTime}ms`);
```

## Recovery Flow

1. **Service Failure**: Multiple failures trigger transition to OPEN state
2. **Wait Period**: Circuit remains OPEN for recovery time duration
3. **Test Phase**: Circuit transitions to HALF_OPEN, allows one test request
4. **Success Path**: Test succeeds → circuit goes to CLOSED, recovery time resets
5. **Failure Path**: Test fails → circuit goes back to OPEN, recovery time doubles

## Backward Compatibility

The enhancement maintains full backward compatibility:
- Existing `isOpen` property continues to work
- All existing function signatures unchanged
- Existing integrations require no modifications

## Benefits

1. **Intelligent Recovery**: Proactive testing of service availability
2. **Reduced Latency**: Faster detection of service recovery
3. **Controlled Load**: Single test request prevents overwhelming recovering services
4. **Adaptive Timing**: Exponential backoff prevents premature recovery attempts
5. **Comprehensive Monitoring**: Detailed logging for debugging and monitoring
6. **Graceful Degradation**: Smooth transition between states

## Implementation Details

### State Transition Logic
```typescript
// OPEN → HALF_OPEN (automatic after recovery time)
if (state.state === CircuitBreakerStateType.OPEN && 
    Date.now() - state.lastFailure > state.recoveryTime) {
  state.state = CircuitBreakerStateType.HALF_OPEN;
}

// HALF_OPEN → CLOSED (on success)
if (previousState === CircuitBreakerStateType.HALF_OPEN) {
  state.state = CircuitBreakerStateType.CLOSED;
  state.recoveryTime = RECOVERY_TIME; // Reset to default
}

// HALF_OPEN → OPEN (on failure)
if (state.state === CircuitBreakerStateType.HALF_OPEN) {
  state.state = CircuitBreakerStateType.OPEN;
  state.recoveryTime = Math.min(
    state.recoveryTime * RECOVERY_BACKOFF_MULTIPLIER, 
    MAX_RECOVERY_TIME
  );
}
```

### Test Request Management
```typescript
// Allow single test request in HALF_OPEN
if (state.state === CircuitBreakerStateType.HALF_OPEN && 
    !state.testRequestInProgress) {
  state.testRequestInProgress = true;
  return true; // Allow request
}
```

This enhancement provides a robust and intelligent recovery mechanism that significantly improves the reliability and responsiveness of the circuit breaker system.
