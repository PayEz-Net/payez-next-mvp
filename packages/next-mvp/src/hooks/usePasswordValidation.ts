/**
 * Password Validation Hook for @payez/next-mvp
 *
 * Provides real-time password validation against IDP password policy.
 * Uses debounced API calls to validate password strength.
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface PasswordPolicy {
  min_length?: number;
  require_uppercase?: boolean;
  require_lowercase?: boolean;
  require_digit?: boolean;
  require_special?: boolean;
  min_strength_score?: number;
}

interface ValidationResult {
  is_valid: boolean;
  score: number;
  failed_requirements: string[];
  tip?: string;
  policy?: PasswordPolicy;
}

interface UsePasswordValidationOptions {
  debounceMs?: number;
}

export function usePasswordValidation(options: UsePasswordValidationOptions = {}) {
  const { debounceMs = 300 } = options;

  const [isValid, setIsValid] = useState(false);
  const [score, setScore] = useState(0);
  const [failedRequirements, setFailedRequirements] = useState<string[]>([]);
  const [tip, setTip] = useState<string | undefined>(undefined);
  const [policy, setPolicy] = useState<PasswordPolicy | undefined>(undefined);
  const [isValidating, setIsValidating] = useState(false);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const validatePassword = useCallback(async (password: string) => {
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

      const data: ValidationResult = await response.json();

      setIsValid(data.is_valid);
      setScore(data.score);
      setFailedRequirements(data.failed_requirements || []);
      setTip(data.tip);
      if (data.policy) {
        setPolicy(data.policy);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('[usePasswordValidation] Error:', err);
        // On error, assume invalid but don't block user
        setIsValid(false);
        setScore(0);
        setFailedRequirements(['Unable to validate password']);
      }
    } finally {
      setIsValidating(false);
    }
  }, []);

  const setPassword = useCallback((password: string) => {
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
  useEffect(() => {
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
