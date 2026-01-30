## 2026-01-30 - User Enumeration Mitigation
**Vulnerability:** The `AuthService.login` method was vulnerable to user enumeration via two vectors: distinct error messages ("User not found" vs "Invalid password") and timing differences (skipping `bcrypt.compare` when user is not found).
**Learning:** Returning distinct error messages for authentication failures is a direct information leak. Even with generic messages, the absence of a computationally expensive operation (like `bcrypt.compare`) for non-existent users allows attackers to infer user existence through timing analysis.
**Prevention:** Always ensure the code path takes approximately the same time regardless of user existence (e.g., using a dummy hash comparison) and return a unified "Invalid credentials" error.
