import { Request, Response, NextFunction } from "express";

// Small in-memory sliding-window limiter for abuse-prone auth endpoints
// (forgot-password, signup, login). Good enough for a single-instance
// deployment; on Lambda each cold execution environment gets its own
// counters, so this is a soft mitigation there rather than a hard cap.
const hits = new Map<string, number[]>();

export function rateLimit(options: { windowMs: number; max: number }) {
  const { windowMs, max } = options;

  return function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const windowStart = now - windowMs;

    const recentHits = (hits.get(key) || []).filter((timestamp) => timestamp > windowStart);
    recentHits.push(now);
    hits.set(key, recentHits);

    if (recentHits.length > max) {
      return res.status(429).json({ error: "Too many requests. Please try again later." });
    }

    next();
  };
}
