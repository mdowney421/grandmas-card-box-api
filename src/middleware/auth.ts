import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { AuthTokenPayload } from "../types";
import { usersCollection } from "../db";

if (!process.env.JWT_SECRET && process.env.NODE_ENV === "production") {
  throw new Error("JWT_SECRET must be set in production — refusing to start with a guessable default");
}

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const AUTH_TOKEN_TTL = "7d";

// Signs the token handed back on signup/login. Kept alongside verification
// so both ends of the JWT lifecycle share one place that knows the secret
// and expiry, instead of each call site re-specifying them.
export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: AUTH_TOKEN_TTL });
}

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

// Use after requireAuth to resolve the JWT payload into an actual user
// document, attached as req.currentUser for every downstream middleware and
// handler to share — nobody after this point needs to query for it again.
export async function loadCurrentUser(req: Request, res: Response, next: NextFunction) {
  if (!req.user || !ObjectId.isValid(req.user.userId)) {
    return res.status(401).json({ error: "Invalid user account" });
  }

  const user = await usersCollection().findOne({ _id: new ObjectId(req.user.userId) });
  if (!user) {
    return res.status(401).json({ error: "User account not found" });
  }

  req.currentUser = user;
  next();
}

// Use after requireAuth + loadCurrentUser on routes only a verified account
// can hit (upload recipe, favorite/unfavorite). An unverified account is
// blocked the same as a logged-out one.
export function requireVerifiedEmail(req: Request, res: Response, next: NextFunction) {
  if (!req.currentUser?.emailVerified) {
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
