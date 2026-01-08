## 2024-02-14 - Auth Controller Hardening
**Vulnerability:** The `AuthController` was logging PII (email addresses) to `console.log` and re-throwing raw error messages (including potential database errors) in 500 responses.
**Learning:** Developers often leave debug logs (`console.log`) in production code, which can leak sensitive user data. Additionally, default exception handling that wraps `error.message` blindly can expose internal architecture or database schema details.
**Prevention:**
1. Use `Logger` with appropriate levels and mask sensitive data.
2. Catch known exceptions and re-throw generic `InternalServerErrorException`s with safe messages for the client, while logging the full error details internally.
3. Apply `@Throttle` decorators to sensitive endpoints like login and register to prevent brute-force attacks.
