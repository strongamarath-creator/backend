# Sentinel's Journal

## 2024-05-23 - Unprotected Controllers & Legacy Code
**Vulnerability:** `UsersController` was completely public because `JwtAuthGuard` was not applied globally or at the controller level, despite being available. Additionally, orphaned legacy files (`user-geo.controller.ts`) used raw Express handlers and manual DB connections, bypassing NestJS architecture.
**Learning:** In this NestJS codebase, Controllers are NOT secure by default. Presence of Guards in the codebase does not imply usage. Legacy files can hide dangerous patterns (manual `PrismaClient` instantiation leading to connection leaks and auth bypass).
**Prevention:** Always verify `@UseGuards` on every Controller. Scan for and remove "dead" files that might expose shadow APIs.
