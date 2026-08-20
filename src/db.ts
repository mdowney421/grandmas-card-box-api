import { MongoClient, Db, Collection } from "mongodb";
import { Recipe, User, Favorite } from "./types";

const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = process.env.MONGO_DB_NAME || "indexCardRecipes";

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
export function recipesCollection(): Collection<Recipe> {
  return db.collection<Recipe>("recipes");
}

export function usersCollection(): Collection<User> {
  return db.collection<User>("users");
}

export function favoritesCollection(): Collection<Favorite> {
  return db.collection<Favorite>("favorites");
}
