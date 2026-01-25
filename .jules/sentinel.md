## 2024-05-23 - Authentication Security Hardening
**Vulnerability:** Username Enumeration and Timing Attacks in `AuthService.login`
**Learning:** The application was throwing distinct exceptions ("User not found" vs "Invalid password") and skipping password verification if the user didn't exist. This allowed attackers to enumerate valid email addresses and use timing analysis to confirm user existence.
**Prevention:**
1.  Always return a generic error message (e.g., "Invalid credentials").
2.  Ensure `bcrypt.compare` is executed for every login attempt, using a pre-calculated dummy hash if the user is not found, to normalize response times.
3.  Use `crypto.randomInt` for generating security tokens (like recovery codes) instead of `Math.random`.
