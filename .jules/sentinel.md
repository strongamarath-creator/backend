## 2025-01-31 - [CRITICAL] Unsecured UsersController and IDOR
**Vulnerability:** The `UsersController` was completely public, allowing anyone to list all users, create users, and modify/delete any user without authentication. Additionally, `GET /users/:id` exposed sensitive PII (email, phone, precise location) to anyone.
**Learning:** NestJS Controllers are public by default unless guarded. `ValidationPipe` protects against bad input but not unauthorized access. Assuming "User Management" controllers are admin-only without explicit guards is a fatal mistake.
**Prevention:**
1.  Apply `@UseGuards(JwtAuthGuard)` globally or at the Controller level by default.
2.  Use a linter rule or a test to verify that every Controller has at least one Guard or is explicitly marked Public.
3.  Separate "Public Profile" DTOs/Logic from "User Private Data" logic.
