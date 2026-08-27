import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import openapiDocument from "./openapi";
import recipesRouter from "./routes/recipes";
import authRouter from "./routes/auth";
import favoritesRouter from "./routes/favorites";
import uploadsRouter from "./routes/uploads";
import { seed } from "./seed";

export const app = express();

// Restrict cross-origin requests to the configured frontend when set;
// falls back to allowing any origin for local development.
app.use(cors(process.env.FRONTEND_URL ? { origin: process.env.FRONTEND_URL } : undefined));
app.use(express.json());

// Point "Try it out" at whatever host actually served this request, so the
// docs work in every environment without a hardcoded/stale server URL.
// An explicit API_BASE_URL always wins when set.
app.use("/api-docs", swaggerUi.serve, (req: Request, res: Response, next: NextFunction) => {
  const host = req.get("host") || "localhost:4000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const baseUrl = process.env.API_BASE_URL || `${protocol}://${host}`;
  const document = { ...openapiDocument, servers: [{ url: baseUrl }] };
  return swaggerUi.setup(document)(req, res, next);
});

app.use("/recipes", recipesRouter);
app.use("/auth", authRouter);
app.use("/favorites", favoritesRouter);
app.use("/uploads", uploadsRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.post("/admin/seed", async (req, res) => {
  const configuredSecret = process.env.SEED_SECRET;
  const providedSecret = req.header("x-seed-secret");

  if (!configuredSecret) {
    return res.status(503).json({ error: "Seed endpoint is not configured" });
  }
  if (!providedSecret || providedSecret !== configuredSecret) {
    return res.status(401).json({ error: "Invalid seed secret" });
  }

  try {
    await seed();
    return res.json({ message: "Seed recipes inserted or updated" });
  } catch (error) {
    console.error("Recipe seed failed:", error);
    return res.status(500).json({ error: "Recipe seed failed" });
  }
});
