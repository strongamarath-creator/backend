## 2024-05-22 - Timing Attack & Username Enumeration in Auth
**Vulnerability:** `AuthService` exposed different error messages and response times for "User not found" vs "Invalid password", allowing attackers to enumerate valid emails.
**Learning:** Even with `bcrypt`, the absence of a hash comparison when a user is not found creates a significant timing difference (fast vs slow).
**Prevention:** Always use a constant-time comparison path (e.g., compare against a pre-calculated dummy hash) and generic error messages ("Invalid credentials") for all authentication failures.
