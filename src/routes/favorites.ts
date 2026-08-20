import { Router } from "express";
import { ObjectId } from "mongodb";
import { favoritesCollection, recipesCollection } from "../db";
import { requireAuth } from "../middleware/auth";

const router = Router();

// All favorites routes require login — only logged-in users have favorites.
router.use(requireAuth);

// GET /favorites — list the current user's favorited recipes (joined with recipe data)
router.get("/", async (req, res) => {
  const userId = new ObjectId(req.user!.userId);

  const favorites = await favoritesCollection().find({ userId }).toArray();
  const recipeIds = favorites.map((f) => f.recipeId);

  const recipes = await recipesCollection()
    .find({ _id: { $in: recipeIds } })
    .toArray();

  res.json(recipes);
});

// POST /favorites/:recipeId — favorite a recipe
router.post("/:recipeId", async (req, res) => {
  if (!ObjectId.isValid(req.params.recipeId)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }

  const userId = new ObjectId(req.user!.userId);
  const recipeId = new ObjectId(req.params.recipeId);

  const recipe = await recipesCollection().findOne({ _id: recipeId });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  try {
    await favoritesCollection().insertOne({ userId, recipeId, createdAt: new Date() });
    await recipesCollection().updateOne({ _id: recipeId }, { $inc: { favoriteCount: 1 } });
    res.status(201).json({ message: "Recipe favorited" });
  } catch (err: any) {
    // Duplicate key error from the unique {userId, recipeId} index — already favorited
    if (err.code === 11000) {
      return res.status(409).json({ error: "Recipe already favorited" });
    }
    throw err;
  }
});

// DELETE /favorites/:recipeId — unfavorite a recipe
router.delete("/:recipeId", async (req, res) => {
  if (!ObjectId.isValid(req.params.recipeId)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }

  const userId = new ObjectId(req.user!.userId);
  const recipeId = new ObjectId(req.params.recipeId);

  const result = await favoritesCollection().deleteOne({ userId, recipeId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "Favorite not found" });
  }

  await recipesCollection().updateOne({ _id: recipeId }, { $inc: { favoriteCount: -1 } });
  res.json({ message: "Recipe unfavorited" });
});

export default router;
