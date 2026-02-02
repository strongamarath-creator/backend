## 2025-02-12 - [Critical] Unprotected Users Controller
**Vulnerability:** The `UsersController` was completely unprotected, exposing all user PII (email, phone, location) via `GET /users` and allowing unauthorized modification/deletion.
**Learning:** In NestJS, controllers are public by default. Developers must explicitly apply `@UseGuards(JwtAuthGuard)` to secure them.
**Prevention:** Enforce a "secure by default" policy where a global guard denies access unless explicitly allowed (using `@Public()` decorator), or implement linter rules to require `@UseGuards` on all controllers.
