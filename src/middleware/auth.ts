import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthTokenPayload } from "../types";
import { usersCollection } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";

// Requires a valid token — use on routes only logged-in users can hit
// (upload recipe, favorite/unfavorite).
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Use after requireAuth on routes only a verified account can hit (upload recipe,
// favorite/unfavorite). An unverified account is blocked the same as a logged-out one.
export async function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  const user = await usersCollection().findOne({ email: req.user!.email });
  if (!user || !user.emailVerified) {
    return res.status(403).json({ error: "Please verify your email to continue" });
  }
  next();
}

// Doesn't block the request if there's no token, but attaches req.user if there is one.
// Useful for routes like GET /recipes/:id where you want to optionally show
// "isFavorited" for the current user without requiring login.
export function attachUserIfPresent(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    } catch {
      // invalid token on an optional route — just proceed unauthenticated
    }
  }
  next();
}

export { JWT_SECRET };
