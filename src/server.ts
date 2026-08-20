import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectToDatabase, recipesCollection, favoritesCollection } from "./db";
import recipesRouter from "./routes/recipes";
import authRouter from "./routes/auth";
import favoritesRouter from "./routes/favorites";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use("/recipes", recipesRouter);
app.use("/auth", authRouter);
app.use("/favorites", favoritesRouter);

app.get("/health", (_req, res) => res.json({ status: "ok" }));

async function start() {
  await connectToDatabase();

  // Ensure indexes exist matching the query patterns (safe to call repeatedly — no-op if already present)
  await recipesCollection().createIndex({ title: "text" });
  await recipesCollection().createIndex({ ingredientCount: 1 });
  await recipesCollection().createIndex({ totalTimeMinutes: 1 });
  await favoritesCollection().createIndex({ userId: 1, recipeId: 1 }, { unique: true });

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
