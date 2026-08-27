import "dotenv/config";
import { connectToDatabase, ensureIndexes } from "./db";
import { app } from "./app";

const PORT = process.env.PORT || 4000;

async function start() {
  await connectToDatabase();
  await ensureIndexes();

  app.listen(PORT, () => {
    console.log(`API running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
