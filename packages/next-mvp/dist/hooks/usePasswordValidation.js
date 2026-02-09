"use strict";
/**
 * Password Validation Hook for @payez/next-mvp
 *
 * Provides real-time password validation against IDP password policy.
 * Uses debounced API calls to validate password strength.
 */
'use client';
/**
 * Password Validation Hook for @payez/next-mvp
 *
 * Provides real-time password validation against IDP password policy.
 * Uses debounced API calls to validate password strength.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.usePasswordValidation = usePasswordValidation;
const react_1 = require("react");
function usePasswordValidation(options = {}) {
    const { debounceMs = 300 } = options;
    const [isValid, setIsValid] = (0, react_1.useState)(false);
    const [score, setScore] = (0, react_1.useState)(0);
    const [failedRequirements, setFailedRequirements] = (0, react_1.useState)([]);
    const [tip, setTip] = (0, react_1.useState)(undefined);
    const [policy, setPolicy] = (0, react_1.useState)(undefined);
    const [isValidating, setIsValidating] = (0, react_1.useState)(false);
    const debounceTimerRef = (0, react_1.useRef)(null);
    const abortControllerRef = (0, react_1.useRef)(null);
    const validatePassword = (0, react_1.useCallback)(async (password) => {
        // Cancel any pending request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        // Don't validate empty passwords
        if (!password || password.length === 0) {
            setIsValid(false);
            setScore(0);
            setFailedRequirements([]);
            setTip(undefined);
            return;
        }
        setIsValidating(true);
        abortControllerRef.current = new AbortController();
        try {
            const response = await fetch('/api/account/validate-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
                signal: abortControllerRef.current.signal,
            });
            const data = await response.json();
            setIsValid(data.is_valid);
            setScore(data.score);
            setFailedRequirements(data.failed_requirements || []);
            setTip(data.tip);
            if (data.policy) {
                setPolicy(data.policy);
            }
        }
        catch (err) {
            if (err.name !== 'AbortError') {
                console.error('[usePasswordValidation] Error:', err);
                // On error, assume invalid but don't block user
                setIsValid(false);
                setScore(0);
                setFailedRequirements(['Unable to validate password']);
            }
        }
        finally {
            setIsValidating(false);
        }
    }, []);
    const setPassword = (0, react_1.useCallback)((password) => {
        // Clear any pending debounce
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        // Debounce the validation
        debounceTimerRef.current = setTimeout(() => {
            validatePassword(password);
        }, debounceMs);
    }, [debounceMs, validatePassword]);
    // Cleanup on unmount
    (0, react_1.useEffect)(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);
    return {
        setPassword,
        isValid,
        score,
        failedRequirements,
        tip,
        policy,
        isValidating,
    };
}
