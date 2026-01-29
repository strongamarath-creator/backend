## 2026-01-29 - Unprotected User Controller
**Vulnerability:** The `UsersController` was completely public, exposing sensitive PII (via `findOne`) and allowing unauthorized modifications (via `update`/`remove`) to any user account.
**Learning:** Default NestJS controllers are public unless guarded. PII leakage through `findAll` or `findOne` is a common oversight when `userSafeSelect` still includes email/phone.
**Prevention:** Always apply `JwtAuthGuard` globally or at the controller level. Use `AdminGuard` for list endpoints. Implement ownership checks for resource-specific endpoints.
