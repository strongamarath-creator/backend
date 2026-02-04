## 2024-05-21 - Unprotected Core Controllers
**Vulnerability:** `UsersController` was completely unprotected, exposing PII and full CRUD access to anonymous users.
**Learning:** Core controllers were assumed to be internal-only or protected by global guards (which don't exist). The application relies on per-controller guards.
**Prevention:** Enforce a "Secure by Default" strategy where a global guard denies access unless `@Public()` is used, or implement a linter rule requiring `@UseGuards` on all controllers.
