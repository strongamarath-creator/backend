# Sentinel's Journal

## 2025-02-05 - Secured UsersController
**Vulnerability:** The `UsersController` had no authentication or authorization guards. This meant that `GET /users`, `POST /users`, `PATCH /users/:id`, and `DELETE /users/:id` were publicly accessible to anyone. This allowed attackers to enumerate all users (PII leak), create arbitrary users, modify any user profile (IDOR), and delete any user account.

**Learning:** NestJS controllers are public by default unless guarded. It is easy to overlook adding `@UseGuards` when creating new resources. The `UsersService` methods like `create` and `findAll` were returning sensitive PII (via `userSafeSelect`) which made the exposure worse.

**Prevention:**
1.  Enforce a "deny by default" policy by using a global guard (e.g., `APP_GUARD` in `AppModule`) and explicitly using `@Public()` for public endpoints. (This is a future architectural improvement).
2.  Always add `@UseGuards(JwtAuthGuard)` to every controller immediately upon creation.
3.  Implement unit tests that specifically check for the presence of guards on sensitive controllers (as demonstrated in `users.controller.spec.ts`).
