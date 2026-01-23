## 2026-01-23 - Missing Default Auth Guards
**Vulnerability:** `UsersController` was exposed publicly without any guards.
**Learning:** NestJS does not apply guards globally by default unless configured. This codebase relies on per-controller decorators.
**Prevention:** Always verify new controllers have `@UseGuards(JwtAuthGuard)` and `@ApiBearerAuth()`. Consider adding a linter rule or test to enforce this.
