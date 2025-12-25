## 2024-01-26 - [Auth Service Security Hardening]
**Vulnerability:** Weak random number generation in recovery code and potential username enumeration via error messages.
**Learning:** `Math.random()` is not cryptographically secure and should not be used for security-sensitive tokens. Specific error messages (e.g., "User not found") allow attackers to check if an email exists.
**Prevention:** Use `crypto.randomInt` for generating security tokens. Use generic error messages like "Invalid credentials" for authentication failures.
