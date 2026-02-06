## 2026-02-06 - Mitigating Timing Attacks in NestJS Authentication

**Vulnerability:** User Enumeration and Timing Attacks in `AuthService.login`.
**Learning:** Returning specific error messages ("User not found") allows attackers to enumerate valid emails. Early returns when user is missing creates a timing side-channel (bcrypt compare is skipped).
**Prevention:**
1. Always perform `bcrypt.compare` (use a dummy hash if user is missing).
2. Return a generic "Invalid credentials" error for all authentication failures.
3. Pre-calculate dummy hash in constructor to minimize performance impact.
