import type { RequestHandler } from "express";
import { requireAuth } from "./auth.middleware";

/**
 * Sets req.company_id from the authenticated JWT. Run after requireAuth.
 * Never trust client-supplied company_id for data access — use this only.
 */
export const attachTenant: RequestHandler = (req, res, next) => {
  if (!req.user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  req.company_id = req.user.company_id;
  next();
};

/** Auth + tenant context for routes that touch tenant-scoped data */
export const requireTenant: RequestHandler[] = [requireAuth, attachTenant];
