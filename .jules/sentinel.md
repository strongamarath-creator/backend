## 2024-05-22 - UsersController IDOR
**Vulnerability:** `UsersController` endpoints (`update`, `remove`, `findOne`) were completely unprotected, allowing any user to modify or view any other user's data (IDOR).
**Learning:** NestJS controllers are public by default. If `@UseGuards` is missing, endpoints are open to the world.
**Prevention:** Always apply `@UseGuards(JwtAuthGuard)` or similar at the controller level unless the endpoint is explicitly public. Use `e2e` tests or security unit tests to verify access control.
