## 2024-02-12 - Secure Authentication & Timing Attack Mitigation
**Vulnerability:** The login endpoint was vulnerable to User Enumeration and Timing Attacks.
- It returned distinct error messages ("User not found" vs "Invalid password"), allowing attackers to check if an email exists.
- It logged sensitive user identifiers (emails) to `console.warn` / `console.log`.
- It had a timing difference: if a user wasn't found, it returned immediately, whereas if a user was found, it performed a slow `bcrypt.compare`. This allowed timing attacks to determine user existence.

**Learning:** `bcrypt.compare` is computationally expensive by design. If you skip it when a user is not found, you leak information via response time. Also, "helpful" error messages are a security risk in public authentication endpoints.

**Prevention:**
1. Always return a generic error message ("Invalid credentials").
2. Ensure constant-time execution path (or close to it) by performing a "dummy" hash comparison even if the user is not found.
3. Never log sensitive identifiers like emails in production logs.
