"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.circuitBreaker = exports.CircuitBreakerStateType = void 0;
exports.getCircuitBreakerState = getCircuitBreakerState;
exports.canAttemptRefresh = canAttemptRefresh;
exports.recordFailure = recordFailure;
exports.recordSuccess = recordSuccess;
exports.isConnectionRefusedError = isConnectionRefusedError;
exports.isNetworkError = isNetworkError;
exports.getCircuitBreakerStateName = getCircuitBreakerStateName;
exports.isCircuitBreakerOpen = isCircuitBreakerOpen;
exports.isCircuitBreakerHalfOpen = isCircuitBreakerHalfOpen;
exports.isCircuitBreakerClosed = isCircuitBreakerClosed;
exports.attemptRecovery = attemptRecovery;
exports.getTimeUntilRecovery = getTimeUntilRecovery;
exports.resetCircuitBreaker = resetCircuitBreaker;
exports.clearCircuitBreakerStore = clearCircuitBreakerStore;
const CIRCUIT_BREAKER_KEY = 'idp-circuit-breaker';
const isDev = process.env.NODE_ENV === 'development';
const isTest = process.env.NODE_ENV === 'test';
const DEV_CONFIG = { FAILURE_THRESHOLD: 5, RECOVERY_TIME: 10000, RECOVERY_BACKOFF_MULTIPLIER: 1.5, MAX_RECOVERY_TIME: 120000 };
const PROD_CONFIG = { FAILURE_THRESHOLD: 3, RECOVERY_TIME: 30000, RECOVERY_BACKOFF_MULTIPLIER: 2, MAX_RECOVERY_TIME: 300000 };
const TEST_CONFIG = { FAILURE_THRESHOLD: 3, RECOVERY_TIME: 30000, RECOVERY_BACKOFF_MULTIPLIER: 2, MAX_RECOVERY_TIME: 300000 };
const config = isTest ? TEST_CONFIG : (isDev ? DEV_CONFIG : PROD_CONFIG);
const FAILURE_THRESHOLD = config.FAILURE_THRESHOLD;
const RECOVERY_TIME = config.RECOVERY_TIME;
const RECOVERY_BACKOFF_MULTIPLIER = config.RECOVERY_BACKOFF_MULTIPLIER;
const MAX_RECOVERY_TIME = config.MAX_RECOVERY_TIME;
var CircuitBreakerStateType;
(function (CircuitBreakerStateType) {
    CircuitBreakerStateType["CLOSED"] = "CLOSED";
    CircuitBreakerStateType["OPEN"] = "OPEN";
    CircuitBreakerStateType["HALF_OPEN"] = "HALF_OPEN";
})(CircuitBreakerStateType || (exports.CircuitBreakerStateType = CircuitBreakerStateType = {}));
const circuitBreakerStore = new Map();
function getCircuitBreakerState() {
    const state = circuitBreakerStore.get(CIRCUIT_BREAKER_KEY);
    if (!state) {
        const newState = { failures: 0, lastFailure: 0, isOpen: false, state: CircuitBreakerStateType.CLOSED, recoveryTime: RECOVERY_TIME, testRequestInProgress: false, recoveryAttempts: 0 };
        circuitBreakerStore.set(CIRCUIT_BREAKER_KEY, newState);
        return newState;
    }
    if (state.state === CircuitBreakerStateType.OPEN && Date.now() - state.lastFailure > state.recoveryTime) {
        state.state = CircuitBreakerStateType.HALF_OPEN;
        state.isOpen = true;
        state.testRequestInProgress = false;
    }
    return state;
}
function canAttemptRefresh() { const state = getCircuitBreakerState(); if (state.state === CircuitBreakerStateType.CLOSED)
    return true; if (state.state === CircuitBreakerStateType.HALF_OPEN && !state.testRequestInProgress) {
    state.testRequestInProgress = true;
    return true;
} return false; }
function recordFailure(error) { const state = getCircuitBreakerState(); if (state.state === CircuitBreakerStateType.HALF_OPEN) {
    state.state = CircuitBreakerStateType.OPEN;
    state.isOpen = true;
    state.testRequestInProgress = false;
    state.failures++;
    state.lastFailure = Date.now();
    state.recoveryAttempts++;
    state.recoveryTime = Math.min(RECOVERY_TIME * Math.pow(RECOVERY_BACKOFF_MULTIPLIER, state.recoveryAttempts), MAX_RECOVERY_TIME);
}
else {
    state.failures++;
    state.lastFailure = Date.now();
    if (state.failures >= FAILURE_THRESHOLD) {
        state.state = CircuitBreakerStateType.OPEN;
        state.isOpen = true;
        state.testRequestInProgress = false;
        state.recoveryAttempts = 0;
    }
} }
function recordSuccess() { const state = getCircuitBreakerState(); state.state = CircuitBreakerStateType.CLOSED; state.isOpen = false; state.failures = 0; state.testRequestInProgress = false; state.recoveryTime = RECOVERY_TIME; state.recoveryAttempts = 0; }
function isConnectionRefusedError(error) { return error?.cause?.code === 'ECONNREFUSED' || error?.code === 'ECONNREFUSED' || error?.message?.includes('ECONNREFUSED'); }
function isNetworkError(error) { return isConnectionRefusedError(error) || error?.message?.includes('fetch failed') || error?.message?.includes('ENOTFOUND') || error?.message?.includes('ETIMEDOUT') || error?.message?.includes('ECONNRESET') || error?.code === 'ENOTFOUND' || error?.code === 'ETIMEDOUT' || error?.code === 'ECONNRESET'; }
function getCircuitBreakerStateName() { const state = getCircuitBreakerState(); return state.state; }
function isCircuitBreakerOpen() { const state = getCircuitBreakerState(); return state.state === CircuitBreakerStateType.OPEN; }
function isCircuitBreakerHalfOpen() { const state = getCircuitBreakerState(); return state.state === CircuitBreakerStateType.HALF_OPEN; }
function isCircuitBreakerClosed() { const state = getCircuitBreakerState(); return state.state === CircuitBreakerStateType.CLOSED; }
function attemptRecovery() { const state = getCircuitBreakerState(); if (state.state === CircuitBreakerStateType.OPEN && Date.now() - state.lastFailure > state.recoveryTime) {
    state.state = CircuitBreakerStateType.HALF_OPEN;
    state.isOpen = true;
    state.testRequestInProgress = false;
    return true;
} return false; }
function getTimeUntilRecovery() { const state = getCircuitBreakerState(); if (state.state !== CircuitBreakerStateType.OPEN)
    return 0; const timeSinceLastFailure = Date.now() - state.lastFailure; const timeUntilRecovery = state.recoveryTime - timeSinceLastFailure; return Math.max(0, timeUntilRecovery); }
function resetCircuitBreaker() { const state = getCircuitBreakerState(); state.state = CircuitBreakerStateType.CLOSED; state.isOpen = false; state.failures = 0; state.testRequestInProgress = false; state.recoveryTime = RECOVERY_TIME; state.lastFailure = 0; state.recoveryAttempts = 0; }
function clearCircuitBreakerStore() { circuitBreakerStore.clear(); }
exports.circuitBreaker = { getCircuitBreakerState, recordFailure, recordSuccess, isNetworkError, isConnectionRefusedError, canAttemptRefresh, getCircuitBreakerStateName, isCircuitBreakerOpen, isCircuitBreakerHalfOpen, isCircuitBreakerClosed, resetCircuitBreaker, attemptRecovery, getTimeUntilRecovery };
