# Sentinel's Journal

## 2026-02-01 - Critical PII Exposure in UsersController
**Vulnerability:** The `UsersController` was completely unprotected, allowing any unauthenticated user to access `GET /users` (listing all users with email, phone, location) and `GET /users/:id`, as well as modify or delete users via `PATCH` and `DELETE`.
**Learning:** NestJS Controllers are public by default unless guarded. The assumption that sensitive controllers are "admin only" must be explicitly enforced with guards. `userSafeSelect` in `UsersService` included sensitive fields (email, phone, location) which is safe for Admin/Owner but catastrophic for public access.
**Prevention:**
1. Always apply `@UseGuards(JwtAuthGuard)` globally or at the Controller level by default.
2. Explicitly review `select` fields in Services to ensure PII is not exposed to non-owners.
3. Use `AdminGuard` for any bulk retrieval (`findAll`) or creation (`create`) endpoints in controllers that are not strictly for public registration.
