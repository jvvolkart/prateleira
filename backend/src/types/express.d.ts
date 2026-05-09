import type { AuthUser } from "../auth/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Set by attachTenant after requireAuth — use for all tenant-scoped queries */
      company_id?: string;
    }
  }
}

export {};
