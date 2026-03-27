export declare enum CircuitBreakerStateType {
    CLOSED = "CLOSED",
    OPEN = "OPEN",
    HALF_OPEN = "HALF_OPEN"
}
export interface CircuitBreakerState {
    failures: number;
    lastFailure: number;
    isOpen: boolean;
    state: CircuitBreakerStateType;
    recoveryTime: number;
    testRequestInProgress: boolean;
    recoveryAttempts: number;
}
export declare function getCircuitBreakerState(): CircuitBreakerState;
export declare function canAttemptRefresh(): boolean;
export declare function recordFailure(error?: any): void;
export declare function recordSuccess(): void;
export declare function isConnectionRefusedError(error: any): boolean;
export declare function isNetworkError(error: any): boolean;
export declare function getCircuitBreakerStateName(): string;
export declare function isCircuitBreakerOpen(): boolean;
export declare function isCircuitBreakerHalfOpen(): boolean;
export declare function isCircuitBreakerClosed(): boolean;
export declare function attemptRecovery(): boolean;
export declare function getTimeUntilRecovery(): number;
export declare function resetCircuitBreaker(): void;
export declare function clearCircuitBreakerStore(): void;
export declare const circuitBreaker: {
    getCircuitBreakerState: typeof getCircuitBreakerState;
    recordFailure: typeof recordFailure;
    recordSuccess: typeof recordSuccess;
    isNetworkError: typeof isNetworkError;
    isConnectionRefusedError: typeof isConnectionRefusedError;
    canAttemptRefresh: typeof canAttemptRefresh;
    getCircuitBreakerStateName: typeof getCircuitBreakerStateName;
    isCircuitBreakerOpen: typeof isCircuitBreakerOpen;
    isCircuitBreakerHalfOpen: typeof isCircuitBreakerHalfOpen;
    isCircuitBreakerClosed: typeof isCircuitBreakerClosed;
    resetCircuitBreaker: typeof resetCircuitBreaker;
    attemptRecovery: typeof attemptRecovery;
    getTimeUntilRecovery: typeof getTimeUntilRecovery;
};
