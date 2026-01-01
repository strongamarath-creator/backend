## 2024-01-20 - [Auth Hardening]
**Vulnerability:** Username Enumeration via Timing Attacks & Weak RNG for OTPs.
**Learning:** `Math.random()` is insufficient for security tokens. Login endpoints must have constant-time (or near constant-time) responses for both valid and invalid users to prevent user existence probing.
**Prevention:**
1. Use `crypto.randomInt` for any security codes.
2. Execute a dummy `bcrypt.compare` operation when a user is not found to normalize request duration.
3. Standardize error messages to "Invalid credentials".
