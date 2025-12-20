## 2024-05-23 - Authentication Security Patterns
**Vulnerability:** Username Enumeration & Weak PRNG
**Learning:** The codebase previously leaked user existence via specific error messages ("User not found" vs "Invalid password") in `AuthService.login`. It also used `Math.random()` for generating security tokens (recovery codes), which is not cryptographically secure.
**Prevention:**
1. Always use generic error messages like "Invalid credentials" for authentication failures.
2. Use `crypto.randomInt` (Node.js built-in) for generating security-sensitive random numbers/tokens.
