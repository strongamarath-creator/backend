## 2025-02-05 - Critical: Unsecured UsersController
**Vulnerability:** The `UsersController` was completely unprotected, exposing all users' PII (including location, phone, email) via `GET /users` and `GET /users/:id`, and allowing unrestricted modification/deletion.
**Learning:** NestJS controllers are public by default. Applying global pipes or interceptors does NOT apply global guards unless explicitly configured in `APP_GUARD` or `useGlobalGuards`. The developer likely assumed `UsersModule` or global config handled it, but only `ThrottlerGuard` was global.
**Prevention:**
1. Always apply `JwtAuthGuard` globally or ensure every Controller has `@UseGuards`.
2. Use Integration/E2E tests that explicitly check for 401/403 on sensitive endpoints (as added in `test/users-security.e2e-spec.ts`).
3. Audit all controllers for missing `@UseGuards`.
