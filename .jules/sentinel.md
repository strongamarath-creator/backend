## 2024-05-22 - Critical Authorization Bypass in UsersController
**Vulnerability:** The `UsersController` lacked `@UseGuards(JwtAuthGuard)`, allowing unauthenticated users to create, delete, update, and view all users. Additionally, authenticated users could modify or delete other users' accounts (IDOR).
**Learning:** NestJS Controllers are not secure by default. Unlike some frameworks that might default to "deny all", NestJS requires explicit guards. Always verify `JwtAuthGuard` is applied. Also, `JwtStrategy` populates `req.user` with specific fields (e.g., `userId` vs `id`) defined in the strategy's `validate` method; strict adherence to this contract is crucial for authorization checks.
**Prevention:**
1.  Apply `JwtAuthGuard` globally or at the controller level by default.
2.  Implement ownership checks (`req.user.userId === targetId`) for all sensitive resource access.
3.  Use E2E security tests (like `test/users-security.e2e-spec.ts`) to verify access control policies (401/403 responses).
