import type { NextFunction, Request, Response } from "express";

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: "not found" });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (res.headersSent) {
    return;
  }
  console.error(err);
  const expose =
    process.env.NODE_ENV !== "production" && err instanceof Error && err.message;
  res.status(500).json({
    error: expose ? err.message : "server error",
  });
}
