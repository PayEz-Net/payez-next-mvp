# PayEz .NET Core IDP API - Architecture Diagram

```
                                    Internet
                                       │
                          ┌────────────┼────────────┐
                          │    NGINX Ingress       │
                          │   (SSL Termination)    │
                          └────────────┬────────────┘
                                       │
                    ┌──────────────────┼──────────────────┐
                    │                  │                  │
            ┌───────▼────────┐  ┌──────▼──────┐  ┌──────▼──────┐
            │ idp.payez.net  │  │api.payez.net│  │   Other     │
            │ (IDP External) │  │ (Payment)   │  │  Services   │
            │   Port 443     │  │  Port 443   │  │             │
            └───────┬────────┘  └──────┬──────┘  └─────────────┘
                    │                  │
        ┌───────────┼──────────────────┼───────────────┐
        │           │      AKS         │               │
        │  ┌────────▼──────────────────▼─────────┐     │
        │  │     external-services namespace     │     │
        │  │  ┌─────────────┐  ┌─────────────┐   │     │
        │  │  │external-id- │  │ paymentapi  │   │     │
        │  │  │api (IDP)    │  │             │   │     │
        │  │  │             │  │             │   │     │
        │  │  │LoadBalancer │  │LoadBalancer │   │     │
        │  │  │443→443      │  │443→443      │   │     │
        │  │  └─────┬───────┘  └─────┬───────┘   │     │
        │  └────────┼──────────────────┼─────────┘     │
        │           │                  │               │
        │           │    Inter-service │Communication  │
        │           │                  │               │
        │  ┌────────▼──────────────────▼─────────┐     │
        │  │    internal-services namespace      │     │
        │  │  ┌─────────────┐  ┌─────────────┐   │     │
        │  │  │ identityapi │  │encryptionapi│   │     │
        │  │  │             │  │             │   │     │
        │  │  │identity.    │  │encryption.  │   │     │
        │  │  │upsilon...   │  │upsilon...   │   │     │
        │  │  │ClusterIP    │  │ClusterIP    │   │     │
        │  │  └─────┬───────┘  └─────┬───────┘   │     │
        │  │        │                │           │     │
        │  │  ┌─────▼───────┐        │           │     │
        │  │  │cryptaplyapi │        │           │     │
        │  │  │             │        │           │     │
        │  │  │cryptaply.   │        │           │     │
        │  │  │upsilon...   │        │           │     │
        │  │  │ClusterIP    │        │           │     │
        │  │  └─────────────┘        │           │     │
        │  └─────────────────────────┼───────────┘     │
        └────────────────────────────┼─────────────────┘
                                     │
                     ┌───────────────┼───────────────┐
                     │               │               │
               ┌─────▼──────┐  ┌─────▼──────┐  ┌─────▼──────┐
               │   Redis    │  │Azure Key   │  │  Database  │
               │10.6.6.5:   │  │   Vault    │  │    CDE     │
               │   6379     │  │    CDE     │  │ (Private)  │
               │(Session/   │  │(Secrets)   │  │           │
               │ Cache)     │  │           │  │           │
               └────────────┘  └────────────┘  └────────────┘
```

## Key Architecture Details

### External Services (Internet-Facing)
- **External IDP API**: `external-id-api` → `idp.payez.net`
  - LoadBalancer service exposing port 443
  - Handles authentication for external applications (like your Next.js site)
  - Uses `payez-sans.pfx` certificate
  - Image: `payezcontainers.azurecr.io/external-id-api:prodR1004`

- **Payment API**: `paymentapi` → `api.payez.net`
  - LoadBalancer service exposing port 443
  - Main payment processing endpoint
  - Image: `payezcontainers.azurecr.io/paymentapi:stage2R2`

### Internal Services (Private Network)
- **Internal Identity API**: `identityapi` → `identity.upsilonpayments.com`
  - ClusterIP service (internal only)
  - Private DNS resolution within AKS
  - Uses `up-wc.pfx` certificate
  - Image: `payezcontainers.azurecr.io/identityapi:prodR1000`

- **Encryption API**: `encryptionapi` → `encryption.upsilonpayments.com`
  - ClusterIP service (internal only)
  - Handles sensitive data encryption/decryption
  - Azure Workload Identity for Key Vault access
  - Image: `payezcontainers.azurecr.io/encryptionapi:prodR801`

- **CryptAply API**: `cryptaplyapi` → `cryptaply.upsilonpayments.com`
  - ClusterIP service (internal only)
  - Cryptographic operations and token management
  - Azure Workload Identity for Key Vault access
  - Image: `payezcontainers.azurecr.io/cryptaplyapi:prodR72`

### Data Flow - IDP Authentication

```
Next.js App                External IDP              Internal Services
     │                          │                          │
     ├─1. Login Request──────────▶                         │
     │   (with IP/UA headers)    │                         │
     │                          ├─2. Validate Creds───────▶│
     │                          │   (identity.upsilon...)   │
     │                          │                         │
     │                          ├─3. Encrypt Sensitive────▶│
     │                          │   (encryption.upsilon..) │
     │                          │                         │
     │                          ├─4. Generate Tokens──────▶│
     │                          │   (cryptaply.upsilon...) │
     │                          │                         │
     │◀────5. JWT Token─────────┤                         │
     │   (with IP/UA binding)    │                         │
```

### Security Architecture

```
                    ┌─────────────────────────────┐
                    │      Network Policies       │
                    │                             │
    External ◄──────┤ external-services ◄──────── ┤ ◄──── Internet
    Services        │        │                   │
                    │        ▼                   │
                    │ internal-services          │
                    │   (Restricted Access)      │
                    └─────────┬───────────────────┘
                              │
                    ┌─────────▼───────────────────┐
                    │  Azure Key Vault (CDE)     │
                    │                             │
                    │ ┌─────────┐ ┌─────────────┐ │
                    │ │Workload │ │   Secrets   │ │
                    │ │Identity │ │ Management  │ │
                    │ └─────────┘ └─────────────┘ │
                    └─────────────────────────────┘
```

### Service Communication Matrix

| Service        | Can Call                               | Called By              |
|----------------|---------------------------------------|------------------------|
| external-id-api| identity-api, encryption-api, cryptaply| Next.js, Web clients |
| paymentapi     | identity-api, encryption-api, cryptaply| External systems     |
| identityapi    | Database (CDE)                        | external-id-api, payment |
| encryptionapi  | Azure Key Vault (CDE)                 | All services          |
| cryptaplyapi   | Azure Key Vault (CDE)                 | IDP services          |

### Critical Components for PCI DSS Compliance

1. **Network Segmentation**: 
   - External vs Internal namespaces
   - Network policies restricting communication
   - Private DNS for internal services

2. **Data Protection**:
   - All communication over HTTPS (443)
   - Encryption API for sensitive data
   - Key Vault in CDE for secret management

3. **Access Control**:
   - Azure Workload Identity 
   - Service accounts with minimal permissions
   - Certificate-based authentication

4. **Monitoring & Logging**:
   - Graylog integration (10.6.10.5:12201)
   - Service mesh observability
   - Audit trails for all API calls

This architecture ensures that your IDP can securely handle authentication while maintaining PCI DSS compliance through proper network segmentation and data protection.
