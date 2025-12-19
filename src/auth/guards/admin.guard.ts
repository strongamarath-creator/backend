import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from "@nestjs/common";
import { Request } from "express";

interface RequestWithUser extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    const role = user?.role;
    const isAdmin = role === "ADMIN" || role === "admin";

    if (!user || !isAdmin) {
      throw new ForbiddenException("Admin access required");
    }

    return true;
  }
}
