# TODO: OAuth AMR (Authentication Methods Reference) Capture

## Summary
Capture and expose the `amr` claim from OAuth provider ID tokens so IDP customers have full visibility into how their users authenticated.

## Why
The MVP is an IDP platform. Customers integrating OAuth providers should have access to the full authentication context - including whether the user's provider session used MFA, hardware keys, etc.

What they do with that info is their business. Our job is to surface it.

## AMR Claim Values (Examples)
| Value | Meaning |
|-------|---------|
| `pwd` | Password |
| `mfa` | Multi-factor authentication |
| `otp` | One-time password |
| `hwk` | Hardware key (FIDO/WebAuthn) |
| `sms` | SMS verification |
| `pin` | PIN |

## Implementation Tasks

### 1. Capture AMR in OAuth Callback
Extract from provider ID token and pass through.

### 2. Store in Session
Add to `SessionData`:
```typescript
providerAmr?: string[];
```

### 3. Expose to Consuming App
Include in session/JWT so the host app can read and act on it as they see fit.

## Provider Support
| Provider | AMR Support |
|----------|-------------|
| Google | Yes |
| Microsoft | Yes |
| Apple | Limited |
| GitHub | No |

## Priority
Feature completeness item - surface what providers give us.
