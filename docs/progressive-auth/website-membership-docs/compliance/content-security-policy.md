# Content Security Policy (CSP) Declaration

## Overview

This document outlines the Content Security Policy implementation for our Next.js application to ensure PCI compliance and protect against cross-site scripting (XSS) attacks.

## Current CSP Configuration

### Production CSP Header

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vitals.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests
```

### Detailed CSP Directives

#### 1. Default Source (`default-src`)
- **Value**: `'self'`
- **Purpose**: Restricts all resource loading to same-origin by default
- **Compliance**: Prevents unauthorized external resource loading

#### 2. Script Source (`script-src`)
- **Value**: `'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vitals.vercel-insights.com`
- **Purpose**: Controls JavaScript execution sources
- **Allowed Domains**:
  - `'self'`: Same-origin scripts
  - `https://vercel.live`: Vercel development tools
  - `https://vitals.vercel-insights.com`: Vercel analytics
- **Note**: `'unsafe-inline'` and `'unsafe-eval'` are temporarily allowed for Next.js compatibility

#### 3. Style Source (`style-src`)
- **Value**: `'self' 'unsafe-inline' https://fonts.googleapis.com`
- **Purpose**: Controls CSS loading sources
- **Allowed Domains**:
  - `'self'`: Same-origin stylesheets
  - `https://fonts.googleapis.com`: Google Fonts CSS
- **Note**: `'unsafe-inline'` allowed for dynamic styling

#### 4. Font Source (`font-src`)
- **Value**: `'self' https://fonts.gstatic.com data:`
- **Purpose**: Controls font loading sources
- **Allowed Domains**:
  - `'self'`: Same-origin fonts
  - `https://fonts.gstatic.com`: Google Fonts files
  - `data:`: Inline fonts via data URLs

#### 5. Image Source (`img-src`)
- **Value**: `'self' data: https: blob:`
- **Purpose**: Controls image loading sources
- **Allowed Sources**:
  - `'self'`: Same-origin images
  - `data:`: Inline images via data URLs
  - `https:`: All HTTPS images
  - `blob:`: Blob URLs for dynamic images

#### 6. Media Source (`media-src`)
- **Value**: `'self' blob:`
- **Purpose**: Controls audio/video loading sources
- **Allowed Sources**:
  - `'self'`: Same-origin media
  - `blob:`: Blob URLs for dynamic media

#### 7. Object Source (`object-src`)
- **Value**: `'none'`
- **Purpose**: Blocks all object, embed, and applet elements
- **Security**: Prevents plugin-based attacks

#### 8. Base URI (`base-uri`)
- **Value**: `'self'`
- **Purpose**: Restricts base element URI
- **Security**: Prevents base tag injection attacks

#### 9. Form Action (`form-action`)
- **Value**: `'self'`
- **Purpose**: Restricts form submission targets
- **Security**: Prevents form hijacking

#### 10. Frame Ancestors (`frame-ancestors`)
- **Value**: `'none'`
- **Purpose**: Prevents embedding in frames
- **Security**: Protects against clickjacking

#### 11. Security Directives
- **`block-all-mixed-content`**: Blocks HTTP content on HTTPS pages
- **`upgrade-insecure-requests`**: Upgrades HTTP requests to HTTPS

## Implementation Details

### 1. Next.js Configuration

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vitals.vercel-insights.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: https: blob:",
              "media-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "block-all-mixed-content",
              "upgrade-insecure-requests"
            ].join('; ')
          }
        ]
      }
    ]
  }
}
```

### 2. Middleware Enhancement

```typescript
// middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Add CSP header
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://vitals.vercel-insights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; media-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; block-all-mixed-content; upgrade-insecure-requests"
  )
  
  return response
}
```

## Security Considerations

### 1. Unsafe Directives
- **`'unsafe-inline'`**: Currently required for Next.js dynamic styling
- **`'unsafe-eval'`**: Required for React development mode
- **Mitigation**: Plan to remove in future versions with nonce implementation

### 2. Trusted Domains
- **Vercel Services**: Required for deployment and analytics
- **Google Fonts**: Whitelisted for typography
- **HTTPS Only**: All external resources must use HTTPS

### 3. Monitoring
- **CSP Violations**: Logged and monitored via reporting endpoints
- **Regular Review**: Monthly review of CSP effectiveness
- **Incident Response**: Automated alerts for policy violations

## Testing and Validation

### 1. CSP Testing Tools
- **Browser DevTools**: Console warnings for violations
- **CSP Evaluator**: Google's CSP evaluation tool
- **Security Headers**: Online CSP scanner

### 2. Automated Testing
- **Jest Tests**: CSP header validation
- **E2E Tests**: Cypress CSP compliance checks
- **CI/CD Integration**: CSP validation in deployment pipeline

### 3. Manual Testing
- **Cross-browser Testing**: CSP compliance across browsers
- **Mobile Testing**: CSP on mobile devices
- **Accessibility Testing**: CSP impact on assistive technologies

## Compliance Mapping

### 1. PCI DSS Requirements
- **Requirement 6.5.7**: Cross-site scripting (XSS) protection
- **Requirement 6.5.1**: Injection flaws prevention
- **Requirement 6.5.9**: Insecure communications protection

### 2. OWASP Top 10
- **A03 - Injection**: Prevents script injection
- **A05 - Security Misconfiguration**: Proper CSP configuration
- **A10 - Insufficient Logging**: CSP violation logging

### 3. Security Standards
- **NIST**: Security controls implementation
- **ISO 27001**: Information security management
- **CIS Controls**: Critical security controls

## Reporting Configuration

### 1. CSP Reporting
```javascript
// CSP Report-Only for testing
"Content-Security-Policy-Report-Only": "default-src 'self'; report-uri /api/csp-report"
```

### 2. Violation Handling
```javascript
// API route for CSP violations
export async function POST(request: Request) {
  const report = await request.json()
  
  // Log violation
  console.error('CSP Violation:', report)
  
  // Send to monitoring service
  await sendToMonitoring(report)
  
  return new Response('OK', { status: 200 })
}
```

## Future Enhancements

### 1. Nonce Implementation
- **Goal**: Remove `'unsafe-inline'` directives
- **Timeline**: Q2 2025
- **Benefits**: Enhanced security, better compliance

### 2. Strict CSP
- **Goal**: Implement strict-dynamic CSP
- **Timeline**: Q3 2025
- **Benefits**: Modern CSP approach, improved security

### 3. Subresource Integrity
- **Goal**: Add SRI for external resources
- **Timeline**: Q2 2025
- **Benefits**: Resource integrity verification

## Maintenance Schedule

### 1. Regular Reviews
- **Monthly**: CSP effectiveness review
- **Quarterly**: Security assessment
- **Annually**: Comprehensive security audit

### 2. Update Process
- **Change Management**: Documented change process
- **Testing**: Comprehensive testing before deployment
- **Rollback**: Quick rollback procedures

### 3. Documentation
- **Version Control**: CSP changes tracked in Git
- **Change Log**: Documented changes and rationale
- **Training**: Staff training on CSP updates

---

**Document Version**: 1.0
**Last Updated**: January 2025
**Next Review**: February 2025
**Owner**: Security Team
**Approved By**: Chief Information Security Officer
