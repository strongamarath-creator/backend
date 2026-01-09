## 2024-05-21 - Username Enumeration & Timing Attacks in Auth
**Vulnerability:** The authentication service returned specific errors ("User not found" vs "Invalid password") and had different execution times for valid vs invalid emails.
**Learning:** This allows attackers to harvest valid email addresses and potentially brute-force passwords more efficiently.
**Prevention:** Always return generic "Invalid credentials" errors and ensure constant-time comparison (using a dummy hash) regardless of whether the user exists.

## 2024-05-21 - Weak Randomness in Recovery Codes
**Vulnerability:** Account recovery codes were generated using `Math.random()`, which is not cryptographically secure.
**Learning:** Predictable RNG can allow attackers to guess recovery codes and hijack accounts.
**Prevention:** Use `crypto.randomInt` for security-sensitive random values.
