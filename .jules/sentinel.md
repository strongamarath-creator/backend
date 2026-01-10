## 2024-03-24 - Weak Random Number Generation in Account Recovery

**Vulnerability:**
The `AuthService.recoverAccount` method was using `Math.random()` to generate a 6-digit recovery code. `Math.random()` is not cryptographically secure and can be predicted, potentially allowing an attacker to guess valid recovery codes.

**Learning:**
Developers often reach for `Math.random()` for any random number needs because it's built-in and familiar. However, for security contexts like authentication tokens, password resets, or recovery codes, it is insufficient.

**Prevention:**
Always use `crypto.randomInt` (Node.js) or `crypto.getRandomValues` (Browser/Web Crypto API) for security-sensitive random numbers.
