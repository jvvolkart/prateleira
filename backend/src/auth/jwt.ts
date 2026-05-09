import jwt from "jsonwebtoken";
import type { Types } from "mongoose";
import type { UserDoc } from "../models/user.model";

export type AuthUser = {
  userId: string;
  company_id: string;
  role: "admin" | "user";
  email: string;
};

type UserWithId = UserDoc & { _id: Types.ObjectId };

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return secret;
}

export function signToken(user: UserWithId): string {
  const payload = {
    sub: user._id.toString(),
    company_id: String(user.company_id),
    role: user.role,
    email: user.email,
  };
  return jwt.sign(payload, getSecret(), { expiresIn: "7d" });
}

export function verifyToken(token: string): AuthUser {
  const decoded = jwt.verify(token, getSecret()) as jwt.JwtPayload & {
    sub: string;
    company_id: string;
    role: "admin" | "user";
    email: string;
  };
  return {
    userId: decoded.sub,
    company_id: decoded.company_id,
    role: decoded.role,
    email: decoded.email,
  };
}
