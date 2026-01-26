## 2025-01-26 - Missing Authorization in UsersController
**Vulnerability:** `UsersController` endpoints (`GET /users`, `DELETE /users/:id`, etc.) were publicly accessible without any authentication or authorization guards, allowing unauthorized access to user data and account deletion.
**Learning:** NestJS controllers are public by default. The absence of a global AuthGuard meant specific controllers must be manually secured, which was missed for `UsersController`.
**Prevention:** Enforce a "Secure by Default" strategy where a global AuthGuard is applied, and public endpoints are explicitly marked with `@Public()`. Alternatively, ensure all Controllers have `@UseGuards` during code review.
