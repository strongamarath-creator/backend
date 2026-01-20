## 2024-05-22 - Fix User Enumeration and Weak Randomness
**Vulnerability:** User enumeration via distinct error messages in login, and weak random number generation for recovery codes using `Math.random`.
**Learning:** `AuthService` explicitly threw "User not found" vs "Invalid password", allowing attackers to verify registered emails. Recovery codes were predictable.
**Prevention:** Always use generic "Invalid credentials" messages for login failures. Use `crypto.randomInt` for security-sensitive random values.
