## 2025-01-26 - Critical Command Injection in BackupsService
**Vulnerability:** `BackupsService` uses `exec` with insufficient shell escaping (`escapeShell` only escapes double quotes), allowing command injection via `DATABASE_URL` or environment variables if compromised.
**Learning:** Custom shell escaping is rarely sufficient. `spawn` should be used instead of `exec`, or a library like `shell-quote` (though `spawn` is safer).
**Prevention:** Avoid constructing shell commands with string interpolation. Use `child_process.spawn` with argument arrays.

## 2025-01-26 - Timing Attacks in Authentication
**Vulnerability:** `AuthService` leaked user existence via early returns and distinct error messages.
**Learning:** `bcrypt.compare` is expensive; skipping it for non-existent users creates a measurable timing difference (100ms+).
**Prevention:** Use a pre-calculated dummy hash to perform a constant-time comparison even when the user is not found.
