/**
 * Password Validation Hook for @payez/next-mvp
 *
 * Provides real-time password validation against IDP password policy.
 * Uses debounced API calls to validate password strength.
 */
interface PasswordPolicy {
    min_length?: number;
    require_uppercase?: boolean;
    require_lowercase?: boolean;
    require_digit?: boolean;
    require_special?: boolean;
    min_strength_score?: number;
}
interface UsePasswordValidationOptions {
    debounceMs?: number;
}
export declare function usePasswordValidation(options?: UsePasswordValidationOptions): {
    setPassword: (password: string) => void;
    isValid: boolean;
    score: number;
    failedRequirements: string[];
    tip: string | undefined;
    policy: PasswordPolicy | undefined;
    isValidating: boolean;
};
export {};
