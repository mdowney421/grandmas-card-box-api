import "dotenv/config";
import {
  connectToDatabase,
  recipesCollection,
  favoritesCollection,
  usersCollection,
  passwordResetTokensCollection,
  emailVerificationTokensCollection,
} from "./db";
import { app } from "./app";

const PORT = process.env.PORT || 4000;

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
  await emailVerificationTokensCollection().createIndex({ tokenHash: 1 }, { unique: true });
  await emailVerificationTokensCollection().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
