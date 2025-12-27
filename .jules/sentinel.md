## 2024-01-26 - User Enumeration and Insecure Randomness
**Vulnerability:** The application was leaking user existence via specific error messages ("User not found" vs "Invalid password") and using `Math.random()` for security-sensitive recovery codes.
**Learning:** Specific error messages in authentication flows allow attackers to enumerate valid email addresses/phone numbers, which can be used for targeted attacks (e.g., credential stuffing). `Math.random()` is not cryptographically secure and predictable, making it unsuitable for generating OTPs or tokens.
**Prevention:** Always use generic error messages like "Invalid credentials" for authentication failures. Use `crypto.randomInt()` or `crypto.randomBytes()` for generating security tokens or codes.
