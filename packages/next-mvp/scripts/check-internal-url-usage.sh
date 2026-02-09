#!/bin/bash
#
# CI Check: Detect incorrect internal API URL patterns
#
# This script fails if code is using req.url or req.nextUrl.origin to construct
# URLs for internal API calls. These patterns cause 403 errors in Kubernetes
# because they use the external HTTPS URL instead of INTERNAL_API_URL.
#
# CORRECT:   Use internalFetch() or internalRefresh() from @payez/next-mvp/lib/internal-api
# INCORRECT: new URL('/api/...', req.url) or fetch(`${req.nextUrl.origin}/api/...`)
#
# NOTE: new URL(req.url) alone is FINE - it just parses the incoming request URL.
#       The problem is when you construct a NEW path using req.url as the base.
#

set -e

SEARCH_PATH="${1:-.}"
ERRORS_FOUND=0

echo "Checking for incorrect internal URL patterns in: $SEARCH_PATH"
echo "========================================================================"

# Pattern 1: new URL('/api/...', req.url) - constructing internal API URL from request
# This catches: new URL('/api/...', req.url) and new URL("/api/...", req.url)
# But NOT: new URL(req.url) which is just parsing the request
echo ""
echo "Checking for: new URL('/api/...', req.url) pattern"
if grep -rn --include="*.ts" --include="*.tsx" -E "new URL\(['\"][^'\"]*['\"],\s*req\.url" "$SEARCH_PATH" 2>/dev/null | grep -v "node_modules" | grep -v "\.d\.ts"; then
    echo "ERROR: Found 'new URL(path, req.url)' pattern. Use internalFetch() instead."
    ERRORS_FOUND=1
fi

# Pattern 2: new URL('/api/...', req.nextUrl) or new URL(..., req.nextUrl.origin)
echo ""
echo "Checking for: new URL(..., req.nextUrl) pattern"
if grep -rn --include="*.ts" --include="*.tsx" -E "new URL\([^)]+,\s*req\.nextUrl" "$SEARCH_PATH" 2>/dev/null | grep -v "node_modules" | grep -v "\.d\.ts"; then
    echo "ERROR: Found 'new URL(..., req.nextUrl)' pattern. Use internalFetch() instead."
    ERRORS_FOUND=1
fi

# Pattern 3: fetch with req.nextUrl.origin and /api/
echo ""
echo "Checking for: fetch with req.nextUrl.origin and /api/"
if grep -rn --include="*.ts" --include="*.tsx" "req\.nextUrl\.origin.*\/api\/" "$SEARCH_PATH" 2>/dev/null | grep -v "node_modules" | grep -v "\.d\.ts"; then
    echo "ERROR: Found 'req.nextUrl.origin' used with internal API route. Use internalFetch() instead."
    ERRORS_FOUND=1
fi

# Pattern 4: Direct fetch to /api/auth/refresh without using internalRefresh (warning only)
echo ""
echo "Checking for: Direct fetch to /api/auth/refresh (should use internalRefresh)"
if grep -rn --include="*.ts" --include="*.tsx" "fetch.*\/api\/auth\/refresh" "$SEARCH_PATH" 2>/dev/null | grep -v "node_modules" | grep -v "\.d\.ts" | grep -v "internal-api\.ts"; then
    echo "WARNING: Found direct fetch to /api/auth/refresh. Consider using internalRefresh() helper."
    # Not failing on this one as it might be intentional in some cases (client-side refresh)
fi

echo ""
echo "========================================================================"

if [ $ERRORS_FOUND -eq 1 ]; then
    echo "FAILED: Dangerous internal URL patterns detected!"
    echo ""
    echo "Fix: Import and use helpers from @payez/next-mvp/lib/internal-api:"
    echo "  import { internalFetch, internalRefresh } from '@payez/next-mvp/lib/internal-api';"
    echo ""
    echo "Why: Server-to-server calls must use INTERNAL_API_URL (http://service.namespace.svc.cluster.local)"
    echo "     not the external URL from the request (https://api.example.com) which fails in Kubernetes."
    exit 1
else
    echo "PASSED: No dangerous internal URL patterns found."
    exit 0
fi
