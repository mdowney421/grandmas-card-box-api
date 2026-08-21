import "dotenv/config";
import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import {
  connectToDatabase,
  recipesCollection,
  favoritesCollection,
  usersCollection,
  passwordResetTokensCollection,
} from "./db";
import openapiDocument from "./openapi";
import recipesRouter from "./routes/recipes";
import authRouter from "./routes/auth";
import favoritesRouter from "./routes/favorites";
import { seed } from "./seed";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument));

app.use("/recipes", recipesRouter);
app.use("/auth", authRouter);
app.use("/favorites", favoritesRouter);

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

async function start() {
  await connectToDatabase();

  // Ensure indexes exist matching the query patterns (safe to call repeatedly — no-op if already present)
  await recipesCollection().createIndex({ title: "text" });
  await recipesCollection().createIndex({ cookTimeMin: 1 });
  await recipesCollection().createIndex({ id: 1 }, { unique: true });
  await usersCollection().createIndex({ email: 1 }, { unique: true });
  await favoritesCollection().createIndex({ userId: 1, recipeId: 1 }, { unique: true });
  await passwordResetTokensCollection().createIndex({ tokenHash: 1 }, { unique: true });
  await passwordResetTokensCollection().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
