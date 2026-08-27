import "dotenv/config";
import serverlessHttp from "serverless-http";
import type { Handler } from "aws-lambda";
import {
  connectToDatabase,
  recipesCollection,
  favoritesCollection,
  usersCollection,
  passwordResetTokensCollection,
  emailVerificationTokensCollection,
} from "./db";
import { app } from "./app";

const serverlessHandler = serverlessHttp(app);

// Reused across warm invocations of the same Lambda execution environment
let initPromise: Promise<void> | null = null;

async function init() {
  await connectToDatabase();
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

export const handler: Handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (!initPromise) {
    initPromise = init().catch((err) => {
      initPromise = null;
      throw err;
    });
  }
  await initPromise;

  return serverlessHandler(event, context);
};
