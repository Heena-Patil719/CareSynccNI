import { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt";

export function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const token = header.slice("Bearer ".length).trim();
  const payload = verifyToken(token);

  if (!payload) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  req.user = payload;
  next();
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    next();
  };
}
