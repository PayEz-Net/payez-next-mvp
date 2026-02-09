"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchWithSession = fetchWithSession;
async function fetchWithSession(input, init = {}, opts = {}) {
    const retry = opts.retry ?? 1;
    const doFetch = async () => {
        const res = await fetch(input, { ...init, credentials: 'include' });
        if (res.ok)
            return res;
        if (res.status === 401 && retry > 0) {
            const rf = await fetch('/api/auth/refresh', { method: 'POST', headers: { 'Accept': 'application/json' }, credentials: 'include' });
            if (rf.ok)
                return fetchWithSession(input, init, { retry: retry - 1 });
        }
        if ((res.status === 409 || res.status === 503) && retry > 0) {
            const retryAfter = res.headers.get('Retry-After');
            const waitMs = retryAfter ? parseInt(retryAfter) * 1000 : 1000;
            await new Promise(r => setTimeout(r, Math.min(waitMs, 3000)));
            return fetchWithSession(input, init, { retry: retry - 1 });
        }
        return res;
    };
    return doFetch();
}
