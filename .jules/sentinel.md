
## 2025-01-29 - [HIGH] AuthService User Enumeration & PII Leak
**Vulnerability:** The login and recovery endpoints exposed whether a user exists via distinct error messages. Additionally, `AuthService` logged sensitive user data (emails) to the console on failure.
**Learning:** Even standard logic like "User not found" vs "Invalid password" can be a security risk (User Enumeration). Also, `console.warn` in production code is a dangerous habit that leads to PII leaks.
**Prevention:** Always use generic error messages for authentication failures (e.g. "Invalid credentials"). Use proper logger services with sensitive data masking, or avoid logging PII entirely in failure paths.
