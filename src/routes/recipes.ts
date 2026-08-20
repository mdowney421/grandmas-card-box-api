import { Router } from "express";
import { ObjectId, Filter } from "mongodb";
import { recipesCollection, favoritesCollection } from "../db";
import { requireAuth, attachUserIfPresent } from "../middleware/auth";
import { Recipe } from "../types";

const router = Router();

const MAX_ITEMS = 10;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function validateRecipeInput(body: any): string | null {
  if (!body.title || typeof body.title !== "string") return "title is required";
  if (!Array.isArray(body.ingredients) || body.ingredients.length === 0)
    return "ingredients must be a non-empty array";
  if (body.ingredients.length > MAX_ITEMS) return `ingredients cannot exceed ${MAX_ITEMS} items`;
  if (!Array.isArray(body.instructions) || body.instructions.length === 0)
    return "instructions must be a non-empty array";
  if (body.instructions.length > MAX_ITEMS) return `instructions cannot exceed ${MAX_ITEMS} items`;
  if (!body.imageUrl || typeof body.imageUrl !== "string") return "imageUrl is required";
  return null;
}

// GET /recipes?name=pie&maxIngredients=5&maxTime=30
// All filters are optional and combinable.
router.get("/", attachUserIfPresent, async (req, res) => {
  const { name, maxIngredients, maxTime } = req.query;

  const filter: Filter<Recipe> = {};

  if (name && typeof name === "string") {
    filter.$text = { $search: name };
  }
  if (maxIngredients) {
    filter.ingredientCount = { $lte: Number(maxIngredients) };
  }
  if (maxTime) {
    filter.totalTimeMinutes = { $lte: Number(maxTime) };
  }

  const recipes = await recipesCollection().find(filter).limit(50).toArray();

  // If the request is authenticated, flag which of these are favorited
  // by the current user so the frontend can render filled/empty hearts.
  if (req.user) {
    const favorites = await favoritesCollection()
      .find({ userId: new ObjectId(req.user.userId) })
      .toArray();
    const favoritedIds = new Set(favorites.map((f) => f.recipeId.toString()));

    return res.json(
      recipes.map((r) => ({ ...r, isFavorited: favoritedIds.has(r._id!.toString()) }))
    );
  }

  res.json(recipes);
});

// GET /recipes/:id
router.get("/:id", attachUserIfPresent, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }

  const recipe = await recipesCollection().findOne({ _id: new ObjectId(req.params.id) });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  res.json(recipe);
});

// POST /recipes — requires login
router.post("/", requireAuth, async (req, res) => {
  const validationError = validateRecipeInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { title, ingredients, instructions, imageUrl, prepTimeMinutes, cookTimeMinutes } = req.body;

  const newRecipe: Recipe = {
    title,
    slug: slugify(title),
    ingredients,
    ingredientCount: ingredients.length,
    instructions,
    prepTimeMinutes: prepTimeMinutes || 0,
    cookTimeMinutes: cookTimeMinutes || 0,
    totalTimeMinutes: (prepTimeMinutes || 0) + (cookTimeMinutes || 0),
    imageUrl,
    createdBy: new ObjectId(req.user!.userId),
    createdAt: new Date(),
    updatedAt: new Date(),
    favoriteCount: 0,
  };

  const result = await recipesCollection().insertOne(newRecipe);
  res.status(201).json({ ...newRecipe, _id: result.insertedId });
});

// PUT /recipes/:id — requires login, only the original uploader can edit
router.put("/:id", requireAuth, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }

  const validationError = validateRecipeInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const recipe = await recipesCollection().findOne({ _id: new ObjectId(req.params.id) });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  if (recipe.createdBy?.toString() !== req.user!.userId) {
    return res.status(403).json({ error: "You can only edit your own recipes" });
  }

  const { title, ingredients, instructions, imageUrl, prepTimeMinutes, cookTimeMinutes } = req.body;

  await recipesCollection().updateOne(
    { _id: recipe._id },
    {
      $set: {
        title,
        slug: slugify(title),
        ingredients,
        ingredientCount: ingredients.length,
        instructions,
        imageUrl,
        prepTimeMinutes: prepTimeMinutes || 0,
        cookTimeMinutes: cookTimeMinutes || 0,
        totalTimeMinutes: (prepTimeMinutes || 0) + (cookTimeMinutes || 0),
        updatedAt: new Date(),
      },
    }
  );

  res.json({ message: "Recipe updated" });
});

// DELETE /recipes/:id — requires login, only the original uploader can delete
router.delete("/:id", requireAuth, async (req, res) => {
  if (!ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid recipe id" });
  }

  const recipe = await recipesCollection().findOne({ _id: new ObjectId(req.params.id) });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  if (recipe.createdBy?.toString() !== req.user!.userId) {
    return res.status(403).json({ error: "You can only delete your own recipes" });
  }

  await recipesCollection().deleteOne({ _id: recipe._id });
  await favoritesCollection().deleteMany({ recipeId: recipe._id }); // clean up orphaned favorites

  res.json({ message: "Recipe deleted" });
});

export default router;
