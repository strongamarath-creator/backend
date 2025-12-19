import { Request } from "express";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

export interface RequestWithUser extends Request {
  user: {
    userId: number;
    email: string;
    role: string;
    sub?: string; // sometimes sub is used, sometimes userId. JwtStrategy returns userId.
  };
}
