# VeinLink — Healthcare Security Architecture & Zero-Trust Model

## 1. Zero-Trust Security Paradigm

VeinLink enforces zero-trust access controls: no request is trusted based on network origin, internal IP, or service identity. Every operation requires verified identity, role validation, facility assignment, and resource ownership checks.

```text
Request
  ↓
1. Identity Verification (Clerk JWT Validation)
  ↓
2. Role Authorization (requireRole: donor, hospital, admin)
  ↓
3. Facility Scope (requireFacilityScope: facilityId === user.facilityId)
  ↓
4. Resource Ownership (requireResourceOwnership: ownerId === user.clerkId)
  ↓
5. Purpose Consent Check (requirePurposeConsent: status === "GRANTED")
  ↓
Execute Mutation / Query
```

---

## 2. Clerk Authentication vs. Convex Authorization

- **Clerk Authentication**: Validates user credentials (passwords, MFA, social logins), manages session tokens, and returns cryptographic identity subjects (`clerkUserId`).
- **Convex Authorization**: Translates `clerkUserId` to internal healthcare roles, checks facility assignments, evaluates clinical state machines, and enforces access boundaries.

---

## 3. Service-to-Service Security

- **Convex $\to$ FastAPI**: Secure mutual bearer token authentication.
- **Convex $\to$ n8n**: HMAC SHA-256 signature verification (`x-veinlink-signature`) calculated using a shared secret.
- **n8n $\to$ External SMS / Push**: TLS 1.3 encrypted endpoints with rotated API credentials.

---

## 4. HTTP & Application Security Hardening

Configured via `web/next.config.ts`:
- `X-Frame-Options: DENY`: Blocks clickjacking and iframe embedding.
- `X-Content-Type-Options: nosniff`: Prevents MIME-sniffing exploits.
- `Referrer-Policy: strict-origin-when-cross-origin`: Restricts referrer data leakage.
- `Permissions-Policy`: Restricts unauthorized hardware access.
- `Content-Security-Policy`: Prohibits untrusted frame-ancestors.
