"use strict";
/**
 * Themed 2FA Verification Page for @payez/next-mvp
 *
 * PLAIN STYLING, FULL FUNCTIONALITY
 * - Clean, professional appearance
 * - All functional patterns from website-membership
 * - Themeable via ThemeProvider
 *
 * DEPENDENCIES: Only React, Next.js, next-auth, and Tailwind CSS
 * NO shadcn/ui or other UI library required!
 *
 * FEATURES:
 * ✅ Progressive disclosure: method selection → code input
 * ✅ Method locking after selection (prevents accidental multi-send)
 * ✅ Masked contact info display (informational only)
 * ✅ Auto-submit when code reaches 6 digits
 * ✅ Cooldown timers (30s) on resend buttons
 * ✅ Stale session detection (401 → redirect to login)
 * ✅ JWT-specific error detection and messaging
 * ✅ Session viability polling (every 30s) to detect expiration early
 * ✅ Duplicate submission prevention
 * ✅ Success/error states with atomic management
 * ✅ "Change method" action
 * ✅ Session cleanup on success/expiry
 *
 * USAGE:
 * 1. Import from @payez/next-mvp/pages/verify-code
 * 2. Wrap your app with ThemeProvider to customize branding
 */
'use client';
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = VerifyCodePage;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
const navigation_1 = require("next/navigation");
const react_2 = require("next-auth/react");
const react_3 = require("react");
const useTheme_1 = require("../../theme/useTheme");
/**
 * Session storage key to track that user intentionally navigated to verify-code.
 * Prevents auto-redirect back to dashboard when session refreshes in background.
 */
const VERIFY_IN_PROGRESS_KEY = 'idealvibe_2fa_verify_in_progress';
async function checkSessionLiveness() {
    const res = await fetch('/api/auth/get-session', { credentials: 'include' }).catch(() => null);
    if (!res)
        return 'unknown'; // network error / timeout - inconclusive, not proof of death
    if (!res.ok)
        return 'unknown'; // 5xx, 429, etc. - inconclusive, not proof of death
    const body = await res.json().catch(() => null);
    if (body === null)
        return 'unknown'; // malformed 200 body - inconclusive
    return (body.session || body.user) ? 'alive' : 'dead';
}
function VerifyCodeForm() {
    const router = (0, navigation_1.useRouter)();
    const searchParams = (0, navigation_1.useSearchParams)();
    const callbackUrl = searchParams?.get('callbackUrl') || '/dashboard';
    const { data: session, status, update: updateSession } = (0, react_2.useSession)();
    const colors = (0, useTheme_1.useColors)();
    const [method, setMethod] = (0, react_1.useState)(null);
    const [methodLocked, setMethodLocked] = (0, react_1.useState)(false);
    // Form state
    const [code, setCode] = (0, react_1.useState)('');
    const [maskedInfo, setMaskedInfo] = (0, react_1.useState)(null);
    const [loadingMasked, setLoadingMasked] = (0, react_1.useState)(true);
    // Atomic state - only one active at a time
    const [sending, setSending] = (0, react_1.useState)(false);
    const [verifying, setVerifying] = (0, react_1.useState)(false);
    const [success, setSuccess] = (0, react_1.useState)(false);
    const [error, setError] = (0, react_1.useState)(null);
    // Cooldown timers
    const [emailCooldown, setEmailCooldown] = (0, react_1.useState)(0);
    const [smsCooldown, setSmsCooldown] = (0, react_1.useState)(0);
    // Toast notifications
    const [toast, setToast] = (0, react_1.useState)(null);
    // Refs
    const codeInputRef = (0, react_1.useRef)(null);
    const lastSubmittedCode = (0, react_1.useRef)('');
    // Track that user is intentionally on this page
    const [verifyInProgress, setVerifyInProgress] = (0, react_1.useState)(false);
    // ==========================================================================
    // CRITICAL FIX: Mark that user is intentionally on verify page
    // This prevents auto-redirect when background token refresh updates session
    // ==========================================================================
    (0, react_1.useEffect)(() => {
        // On mount, mark that verification is in progress
        if (typeof window !== 'undefined') {
            const wasInProgress = sessionStorage.getItem(VERIFY_IN_PROGRESS_KEY) === 'true';
            if (!wasInProgress) {
                console.log('[2FA] User navigated to verify-code page, marking verify in progress');
                sessionStorage.setItem(VERIFY_IN_PROGRESS_KEY, 'true');
            }
            setVerifyInProgress(true);
        }
    }, []);
    // Auto-dismiss toast
    (0, react_1.useEffect)(() => {
        if (toast) {
            const timer = setTimeout(() => setToast(null), 2500);
            return () => clearTimeout(timer);
        }
    }, [toast]);
    // Cooldown countdown
    (0, react_1.useEffect)(() => {
        if (emailCooldown > 0) {
            const timer = setTimeout(() => setEmailCooldown(emailCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [emailCooldown]);
    (0, react_1.useEffect)(() => {
        if (smsCooldown > 0) {
            const timer = setTimeout(() => setSmsCooldown(smsCooldown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [smsCooldown]);
    // Fetch masked info on mount
    (0, react_1.useEffect)(() => {
        const fetchMaskedInfo = async () => {
            // BUGFIX: Always set loadingMasked=false, even if not authenticated
            // Otherwise page stays stuck in loading spinner
            if (status !== 'authenticated' || !session) {
                setLoadingMasked(false);
                return;
            }
            try {
                const res = await fetch('/api/account/masked-info', {
                    method: 'POST',
                    credentials: 'include',
                });
                if (res.status === 401) {
                    // Session expired - redirect to login
                    setError('Your session has expired. Redirecting to login...');
                    setTimeout(async () => {
                        await (0, react_2.signOut)({ redirect: false });
                        const safeCallback = callbackUrl.startsWith('/account-auth/') ? '/dashboard' : callbackUrl;
                        router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(safeCallback)}`);
                    }, 1200);
                    return;
                }
                if (!res.ok) {
                    throw new Error('Failed to load contact information');
                }
                const data = await res.json();
                setMaskedInfo(data);
            }
            catch (err) {
                console.error('[2FA] Error fetching masked info:', err);
                setError('Could not load your contact information. Please try again.');
            }
            finally {
                setLoadingMasked(false);
            }
        };
        fetchMaskedInfo();
    }, [status, session, callbackUrl, router]);
    // Auto-submit when code is 6 digits
    (0, react_1.useEffect)(() => {
        if (code.length === 6 && method && !verifying) {
            handleVerifyCode();
        }
    }, [code, method, verifying]);
    // ==========================================================================
    // Session viability check - detect expiration early and warn user
    // ==========================================================================
    (0, react_1.useEffect)(() => {
        if (status !== 'authenticated')
            return;
        // Check session viability every 30 seconds
        const checkSession = async () => {
            try {
                const res = await fetch('/api/session/viability', {
                    credentials: 'include',
                });
                // 184998: this watchdog was dead by two independent faults - it gated
                // on res.status === 401 (viability never returns 401; every real
                // answer is 200) and then read data.valid/data.mfaExpired, which the
                // endpoint has never emitted. The real shape is viable /
                // accessTokenExpired / reason.
                const data = await res.json().catch(() => null);
                if (!data)
                    return; // unparseable body (e.g. a 500 page) - inconclusive, next tick retries
                // 183483's rule: a single non-authoritative signal may never end a
                // session on its own. viable:false is not proof of death - the route
                // returns it for a Redis-store-miss stale-cookie read (170033's exact
                // failure mode) with a LIVE session. Treat it as a prompt to check,
                // and defer to checkSessionLiveness() as the sole authority: only
                // 'dead' proceeds; 'unknown' is held exactly like 'alive'.
                const looksExpired = data.viable === false || data.accessTokenExpired === true;
                if (!looksExpired)
                    return;
                if (await checkSessionLiveness() !== 'dead')
                    return;
                setError('Your session has expired. Redirecting to login...');
                setTimeout(async () => {
                    await (0, react_2.signOut)({ redirect: false });
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
                    }
                    router.push(`/account-auth/login?error=SessionExpired`);
                }, 2000);
            }
            catch (err) {
                // Silent fail - let the next actual API call handle the error
                console.log('[2FA] Session viability check failed:', err);
            }
        };
        // Initial check after 5 seconds, then every 30 seconds
        const initialTimeout = setTimeout(checkSession, 5000);
        const interval = setInterval(checkSession, 30000);
        return () => {
            clearTimeout(initialTimeout);
            clearInterval(interval);
        };
    }, [status, router]);
    const handleSendCode = async (selectedMethod) => {
        setSending(true);
        setError(null);
        try {
            const res = await fetch('/api/account/send-code', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ method: selectedMethod }),
                credentials: 'include',
            });
            if (res.status === 401) {
                const errorData = await res.json().catch(() => ({}));
                const isJwtExpired = errorData?.error?.includes('JWT') || errorData?.message?.includes('JWT') || errorData?.error?.includes('expired');
                setError(isJwtExpired
                    ? 'Your 2FA session has expired. Please sign in again.'
                    : 'Your session has expired. Redirecting to login...');
                setTimeout(async () => {
                    await (0, react_2.signOut)({ redirect: false });
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
                    }
                    const safeCallback = callbackUrl.startsWith('/account-auth/') ? '/dashboard' : callbackUrl;
                    const errorParam = isJwtExpired ? '&error=SessionExpired' : '';
                    router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(safeCallback)}${errorParam}`);
                }, 1500);
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || data.error || 'Failed to send code');
            }
            // Lock method and set cooldown
            setMethod(selectedMethod);
            setMethodLocked(true);
            if (selectedMethod === 'email') {
                setEmailCooldown(30);
            }
            else {
                setSmsCooldown(30);
            }
            setToast({
                type: 'success',
                message: `Verification code sent to your ${selectedMethod === 'email' ? 'email' : 'phone'}`,
            });
            // Focus code input
            setTimeout(() => codeInputRef.current?.focus(), 100);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send verification code');
        }
        finally {
            setSending(false);
        }
    };
    const handleVerifyCode = async () => {
        if (!code || !method || code.length !== 6) {
            return;
        }
        // Prevent duplicate submissions
        if (lastSubmittedCode.current === code) {
            console.log('[2FA] Duplicate submission prevented');
            return;
        }
        lastSubmittedCode.current = code;
        setVerifying(true);
        setError(null);
        try {
            const endpoint = method === 'sms' ? '/api/account/verify-sms' : '/api/account/verify-email';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ verificationCode: code }),
                credentials: 'include',
            });
            if (res.status === 401) {
                const errorData = await res.json().catch(() => ({}));
                const isJwtExpired = errorData?.error?.includes('JWT') || errorData?.message?.includes('JWT') || errorData?.error?.includes('expired');
                setError(isJwtExpired
                    ? 'Your 2FA session has expired. Please sign in again.'
                    : 'Your session has expired. Redirecting to login...');
                setTimeout(async () => {
                    await (0, react_2.signOut)({ redirect: false });
                    if (typeof window !== 'undefined') {
                        sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
                    }
                    const safeCallback = callbackUrl.startsWith('/account-auth/') ? '/dashboard' : callbackUrl;
                    const errorParam = isJwtExpired ? '&error=SessionExpired' : '';
                    router.push(`/account-auth/login?callbackUrl=${encodeURIComponent(safeCallback)}${errorParam}`);
                }, 1500);
                return;
            }
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.message || 'Verification failed');
            }
            const result = await res.json();
            // Normalize response: support both enveloped and unwrapped payloads
            const payload = (result && typeof result === 'object' && 'data' in result)
                ? result.data
                : result;
            // Check if verification was successful
            const verified = payload?.verificationSuccessful === true ||
                payload?.twoFactorSessionVerified === true ||
                payload?.success === true ||
                // Accept token-based success (unwrapped raw tokens from backend)
                (!!payload?.access_token && !!payload?.refresh_token);
            if (!verified) {
                throw new Error('Verification failed. Please try again.');
            }
            // CRITICAL: If tokens are included (unwrapped response), persist them in server session
            if (payload?.access_token && payload?.refresh_token) {
                try {
                    console.log('[2FA] Updating session with new MFA tokens...');
                    const updateRes = await fetch('/api/auth/update-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            access_token: payload.access_token,
                            refresh_token: payload.refresh_token
                        })
                    });
                    if (!updateRes.ok) {
                        console.warn('[2FA] update-session returned non-OK status:', updateRes.status);
                        const errorData = await updateRes.json();
                        console.warn('[2FA] update-session error:', errorData);
                    }
                    else {
                        console.log('[2FA] Session updated successfully with MFA tokens');
                    }
                }
                catch (e) {
                    console.warn('[2FA] Failed to call update-session:', e);
                }
            }
            // Show success state
            setSuccess(true);
            setError(null);
            // CRITICAL: Force NextAuth to refetch session from server
            // This ensures useSession() gets the updated twoFactorComplete: true
            console.log('[2FA] Forcing session refresh after verification...');
            try {
                await updateSession(); // This triggers /api/auth/session and updates useSession() state
                console.log('[2FA] Session refresh completed');
            }
            catch (e) {
                console.warn('[2FA] updateSession failed:', e);
            }
            // Clear verify-in-progress flag before redirect
            if (typeof window !== 'undefined') {
                sessionStorage.removeItem(VERIFY_IN_PROGRESS_KEY);
            }
            // Redirect after showing success state
            setTimeout(() => {
                window.location.href = callbackUrl;
            }, 1500);
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to verify code');
            lastSubmittedCode.current = ''; // Allow retry
        }
        finally {
            setVerifying(false);
        }
    };
    const handleResetMethod = () => {
        setMethod(null);
        setMethodLocked(false);
        setCode('');
        setError(null);
        setEmailCooldown(0);
        setSmsCooldown(0);
        lastSubmittedCode.current = '';
    };
    const handleCodeChange = (e) => {
        const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
        setCode(value);
    };
    // Loading state
    if (status === 'loading' || loadingMasked) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex flex-col items-center justify-center py-8", style: { background: 'hsl(var(--background))' }, children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-10 w-10", style: { color: 'hsl(var(--primary))' }, viewBox: "0 0 24 24", fill: "none", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-sm", style: { color: 'hsl(var(--muted-foreground))' }, children: "Loading..." })] }));
    }
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center px-4 py-8", style: { background: 'hsl(var(--background))' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "max-w-md w-full", children: [toast && ((0, jsx_runtime_1.jsx)("div", { className: `fixed top-4 right-4 p-4 rounded border transition-all duration-300 ${toast.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`, children: toast.message })), (0, jsx_runtime_1.jsxs)("div", { className: "rounded-2xl border p-8", style: { background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "mb-6", children: [(0, jsx_runtime_1.jsx)("h1", { className: "text-2xl font-semibold mb-2", style: { color: 'hsl(var(--foreground))' }, children: "Verify Your Identity" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", style: { color: 'hsl(var(--muted-foreground))' }, children: "Choose how you'd like to receive your verification code" })] }), maskedInfo && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-6 p-3 rounded border text-sm", style: { background: 'hsl(var(--muted) / 0.1)', borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }, children: [maskedInfo.masked_email && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-1", children: ["Email: ", (0, jsx_runtime_1.jsx)("span", { className: "font-mono", children: maskedInfo.masked_email })] })), maskedInfo.masked_phone_number && ((0, jsx_runtime_1.jsxs)("div", { children: ["Phone: ", (0, jsx_runtime_1.jsx)("span", { className: "font-mono", children: maskedInfo.masked_phone_number })] }))] })), !method ? (
                        /* Method Selection */
                        (0, jsx_runtime_1.jsxs)("div", { className: "space-y-3", children: [(0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => handleSendCode('email'), disabled: sending || !maskedInfo?.masked_email, className: "w-full flex items-center justify-between p-3 border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors", style: {
                                        background: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))'
                                    }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-left", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium", style: { color: 'hsl(var(--foreground))' }, children: "Email" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", style: { color: 'hsl(var(--muted-foreground))' }, children: maskedInfo?.masked_email || 'Not available' })] }), (0, jsx_runtime_1.jsx)("span", { style: { color: 'hsl(var(--muted-foreground))' }, children: "\u2192" })] }), (0, jsx_runtime_1.jsxs)("button", { type: "button", onClick: () => handleSendCode('sms'), disabled: sending || !maskedInfo?.masked_phone_number, className: "w-full flex items-center justify-between p-3 border rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors", style: {
                                        background: 'hsl(var(--card))',
                                        borderColor: 'hsl(var(--border))',
                                        color: 'hsl(var(--foreground))'
                                    }, children: [(0, jsx_runtime_1.jsxs)("div", { className: "text-left", children: [(0, jsx_runtime_1.jsx)("p", { className: "font-medium", style: { color: 'hsl(var(--foreground))' }, children: "SMS" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm", style: { color: 'hsl(var(--muted-foreground))' }, children: maskedInfo?.masked_phone_number || 'Not available' })] }), (0, jsx_runtime_1.jsx)("span", { style: { color: 'hsl(var(--muted-foreground))' }, children: "\u2192" })] })] })) : (
                        /* Code Input */
                        (0, jsx_runtime_1.jsxs)("div", { className: "space-y-4", children: [(0, jsx_runtime_1.jsxs)("div", { className: "flex items-center justify-between p-3 rounded border", style: { background: 'hsl(var(--muted) / 0.1)', borderColor: 'hsl(var(--border))' }, children: [(0, jsx_runtime_1.jsxs)("span", { className: "text-sm", style: { color: 'hsl(var(--foreground))' }, children: ["Code sent to your ", method === 'email' ? 'email' : 'phone'] }), (0, jsx_runtime_1.jsx)("button", { type: "button", onClick: handleResetMethod, className: "text-sm hover:underline font-medium", style: { color: 'hsl(var(--primary))' }, children: "Change method" })] }), (0, jsx_runtime_1.jsxs)("div", { children: [(0, jsx_runtime_1.jsx)("label", { htmlFor: "code", className: "block text-sm font-medium mb-2", style: { color: 'hsl(var(--foreground))' }, children: "Verification Code" }), (0, jsx_runtime_1.jsx)("input", { ref: codeInputRef, id: "code", type: "text", inputMode: "numeric", pattern: "[0-9]*", maxLength: 6, value: code, onChange: handleCodeChange, className: "w-full px-4 py-3 text-center text-2xl font-mono border rounded focus:ring-2 tracking-widest", style: {
                                                background: 'hsl(var(--input))',
                                                borderColor: 'hsl(var(--border))',
                                                color: 'hsl(var(--foreground))',
                                                caretColor: 'hsl(var(--foreground))'
                                            }, placeholder: "000000", disabled: verifying || success, autoComplete: "one-time-code", autoFocus: true }), (0, jsx_runtime_1.jsx)("p", { className: "mt-2 text-sm text-center", style: { color: 'hsl(var(--muted-foreground))' }, children: "Enter the 6-digit code" })] }), (0, jsx_runtime_1.jsx)("div", { className: "min-h-[3.5rem] flex items-center", children: verifying ? ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start space-x-2 p-3 rounded border", style: { background: 'hsl(var(--muted) / 0.1)', borderColor: 'hsl(var(--border))' }, children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin w-4 h-4 mt-0.5", style: { color: 'hsl(var(--primary))' }, fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), (0, jsx_runtime_1.jsx)("span", { className: "text-sm", style: { color: 'hsl(var(--foreground))' }, children: "Verifying code..." })] })) : error ? ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start space-x-2 p-3 rounded bg-red-50 border border-red-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-red-700 text-sm font-medium", children: "\u2717" }), (0, jsx_runtime_1.jsx)("span", { className: "text-red-700 text-sm", children: error })] })) : success ? ((0, jsx_runtime_1.jsxs)("div", { className: "w-full flex items-start space-x-2 p-2.5 rounded bg-green-50 border border-green-200", children: [(0, jsx_runtime_1.jsx)("span", { className: "text-green-700 text-xs font-medium", children: "\u2713" }), (0, jsx_runtime_1.jsx)("span", { className: "text-green-700 text-xs", children: "Verification successful! Redirecting..." })] })) : null }), methodLocked && ((0, jsx_runtime_1.jsx)("button", { type: "button", onClick: () => handleSendCode(method), disabled: sending || (method === 'email' ? emailCooldown > 0 : smsCooldown > 0), className: "w-full text-sm hover:underline font-medium disabled:no-underline disabled:cursor-not-allowed disabled:opacity-50", style: { color: 'hsl(var(--primary))' }, children: sending
                                        ? 'Sending...'
                                        : method === 'email'
                                            ? emailCooldown > 0
                                                ? `Resend code in ${emailCooldown}s`
                                                : 'Resend code'
                                            : smsCooldown > 0
                                                ? `Resend code in ${smsCooldown}s`
                                                : 'Resend code' }))] }))] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4 text-center text-sm", style: { color: 'hsl(var(--muted-foreground))' }, children: (0, jsx_runtime_1.jsx)("a", { href: "/account-auth/login", className: "hover:underline font-medium", style: { color: 'hsl(var(--primary))' }, children: "Back to login" }) })] }) }));
}
function VerifyCodePageFallback() {
    const colors = (0, useTheme_1.useColors)();
    return ((0, jsx_runtime_1.jsx)("div", { className: "flex items-center justify-center py-8", style: { background: 'hsl(var(--background))' }, children: (0, jsx_runtime_1.jsxs)("div", { className: "text-center", children: [(0, jsx_runtime_1.jsxs)("svg", { className: "animate-spin h-10 w-10 mx-auto", style: { color: 'hsl(var(--primary))' }, xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", children: [(0, jsx_runtime_1.jsx)("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), (0, jsx_runtime_1.jsx)("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })] }), (0, jsx_runtime_1.jsx)("p", { className: "mt-4", style: { color: 'hsl(var(--muted-foreground))' }, children: "Loading..." })] }) }));
}
function VerifyCodePage() {
    return ((0, jsx_runtime_1.jsx)(react_3.Suspense, { fallback: (0, jsx_runtime_1.jsx)(VerifyCodePageFallback, {}), children: (0, jsx_runtime_1.jsx)(VerifyCodeForm, {}) }));
}
