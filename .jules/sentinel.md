## 2024-05-22 - Authentication User Enumeration
**Vulnerability:** The `AuthService.login` method returned distinct error messages ("User not found" vs "Invalid password") and logged sensitive identifiers (email/phone) upon failure.
**Learning:** This allowed attackers to enumerate valid email addresses and phone numbers in the system.
**Prevention:** Always use generic error messages like "Invalid credentials" for all authentication failures. Use `bcrypt.compare` with a dummy hash when the user is not found to mitigate timing attacks.
