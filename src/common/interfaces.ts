import { Request } from "express";

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
  };
}

export interface JwtPayload {
  email: string;
  sub: string;
  userId?: string; // For compatibility if needed
}
