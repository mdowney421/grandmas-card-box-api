import { MongoClient, Db, Collection } from "mongodb";
import { RecipeDocument, User, Favorite, PasswordResetToken, EmailVerificationToken } from "./types";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
// Accept both spellings — deployed environments have used MONGODB_NAME in the past.
const dbName = process.env.MONGO_DB_NAME || process.env.MONGODB_NAME || "indexCardRecipes";

let client: MongoClient;
let db: Db;

export async function connectToDatabase(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);

  console.log(`Connected to MongoDB: ${dbName}`);
  return db;
}

// Typed collection getters — call these from routes instead of db.collection("recipes")
// so every query is checked against the Recipe/User/Favorite interfaces.
export function recipesCollection(): Collection<RecipeDocument> {
  return db.collection<RecipeDocument>("recipes");
}

export function usersCollection(): Collection<User> {
  return db.collection<User>("users");
}

export function favoritesCollection(): Collection<Favorite> {
  return db.collection<Favorite>("favorites");
}

export function passwordResetTokensCollection(): Collection<PasswordResetToken> {
  return db.collection<PasswordResetToken>("passwordResetTokens");
}

export function emailVerificationTokensCollection(): Collection<EmailVerificationToken> {
  return db.collection<EmailVerificationToken>("emailVerificationTokens");
}

// Matches the query patterns used across the app — safe to call repeatedly,
// a no-op if the indexes already exist. Shared by both entrypoints (server.ts
// for the long-running deployment, lambda.ts for the serverless one) so they
// can't drift out of sync with each other.
export async function ensureIndexes(): Promise<void> {
  await recipesCollection().createIndex({ title: "text" });
  await recipesCollection().createIndex({ cookTimeMin: 1 });
  await recipesCollection().createIndex({ id: 1 }, { unique: true });
  await usersCollection().createIndex({ email: 1 }, { unique: true });
  await favoritesCollection().createIndex({ userId: 1, recipeId: 1 }, { unique: true });
  await passwordResetTokensCollection().createIndex({ tokenHash: 1 }, { unique: true });
  await passwordResetTokensCollection().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await emailVerificationTokensCollection().createIndex({ tokenHash: 1 }, { unique: true });
  await emailVerificationTokensCollection().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
}
