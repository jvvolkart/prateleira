import type { RequestHandler } from "express";

/** Must run after requireAuth / attachTenant */
export const requireAdmin: RequestHandler = (req, res, next) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "admin only" });
    return;
  }
  next();
};
