import "dotenv/config";
import serverlessHttp from "serverless-http";
import type { Handler } from "aws-lambda";
import { connectToDatabase, ensureIndexes } from "./db";
import { app } from "./app";

const serverlessHandler = serverlessHttp(app);

// Reused across warm invocations of the same Lambda execution environment
let initPromise: Promise<void> | null = null;

async function init() {
  await connectToDatabase();
  await ensureIndexes();
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
