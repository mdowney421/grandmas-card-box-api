import { Router } from "express";
import { ObjectId, Filter } from "mongodb";
import { recipesCollection, favoritesCollection, usersCollection } from "../db";
import { requireAuth, attachUserIfPresent } from "../middleware/auth";
import { RecipeDocument } from "../types";

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
  if (body.ingredients.some((ingredient: unknown) => typeof ingredient !== "string"))
    return "ingredients must be strings";
  if (!Array.isArray(body.instructions) || body.instructions.length === 0)
    return "instructions must be a non-empty array";
  if (body.instructions.length > MAX_ITEMS) return `instructions cannot exceed ${MAX_ITEMS} items`;
  if (!Number.isInteger(body.servings) || body.servings < 1)
    return "servings must be a positive integer";
  return null;
}

export function toPublicRecipe(recipe: RecipeDocument, inMyBox = false) {
  const { _id, createdBy, updatedAt, favoriteCount, ...publicRecipe } = recipe;
  return { ...publicRecipe, inMyBox };
}

// GET /recipes?name=pie&maxIngredients=5&maxTime=30
// All filters are optional and combinable.
router.get("/", attachUserIfPresent, async (req, res) => {
  const { name, maxIngredients, maxTime } = req.query;

  const filter: Filter<RecipeDocument> = {};

  if (name && typeof name === "string") {
    filter.$text = { $search: name };
  }
  if (maxIngredients) {
    filter.$expr = { $lte: [{ $size: "$ingredients" }, Number(maxIngredients)] };
  }
  if (maxTime) {
    filter.totalTimeMin = { $lte: Number(maxTime) };
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
      recipes.map((r) => toPublicRecipe(r, favoritedIds.has(r.id)))
    );
  }

  res.json(recipes.map((recipe) => toPublicRecipe(recipe)));
});

// GET /recipes/:id
router.get("/:id", attachUserIfPresent, async (req, res) => {
  const recipe = await recipesCollection().findOne({ id: req.params.id });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  res.json(toPublicRecipe(recipe));
});

// POST /recipes — requires login
router.post("/", requireAuth, async (req, res) => {
  const validationError = validateRecipeInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const { title, ingredients, instructions, prepTimeMin, cookTimeMin, tag, imageUrl, warningNote, servings, difficulty } = req.body;
  const uploader = await usersCollection().findOne({ _id: new ObjectId(req.user!.userId) });
  if (!uploader) return res.status(401).json({ error: "User account not found" });
  const now = new Date();
  const normalizedPrepTimeMin = prepTimeMin || 0;
  const normalizedCookTimeMin = cookTimeMin || 0;

  const newRecipe: RecipeDocument = {
    id: new ObjectId().toHexString(),
    title,
    ingredients,
    instructions,
    prepTimeMin: normalizedPrepTimeMin,
    cookTimeMin: normalizedCookTimeMin,
    totalTimeMin: normalizedPrepTimeMin + normalizedCookTimeMin,
    tag: tag || "Dinner",
    imageUrl,
    warningNote,
    servings,
    difficulty,
    createdAt: now.toISOString(),
    isUserUpload: true,
    inMyBox: false,
    createdBy: new ObjectId(req.user!.userId),
    createdByDisplayName: uploader.displayName,
    updatedAt: now,
    favoriteCount: 0,
  };

  const result = await recipesCollection().insertOne(newRecipe);
  res.status(201).json(toPublicRecipe({ ...newRecipe, _id: result.insertedId }));
});

// PUT /recipes/:id — requires login, only the original uploader can edit
router.put("/:id", requireAuth, async (req, res) => {
  const validationError = validateRecipeInput(req.body);
  if (validationError) return res.status(400).json({ error: validationError });

  const recipe = await recipesCollection().findOne({ id: req.params.id });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  if (recipe.createdBy?.toString() !== req.user!.userId) {
    return res.status(403).json({ error: "You can only edit your own recipes" });
  }

  const { title, ingredients, instructions, prepTimeMin, cookTimeMin, tag, imageUrl, warningNote, servings, difficulty } = req.body;
  const normalizedPrepTimeMin = prepTimeMin || 0;
  const normalizedCookTimeMin = cookTimeMin || 0;

  await recipesCollection().updateOne(
    { id: recipe.id },
    {
      $set: {
        title,
        ingredients,
        instructions,
        prepTimeMin: normalizedPrepTimeMin,
        cookTimeMin: normalizedCookTimeMin,
        totalTimeMin: normalizedPrepTimeMin + normalizedCookTimeMin,
        tag: tag || "Dinner",
        imageUrl,
        warningNote,
        servings,
        difficulty,
        updatedAt: new Date(),
      },
    }
  );

  res.json({ message: "Recipe updated" });
});

// DELETE /recipes/:id — requires login, only the original uploader can delete
router.delete("/:id", requireAuth, async (req, res) => {
  const recipe = await recipesCollection().findOne({ id: req.params.id });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  if (recipe.createdBy?.toString() !== req.user!.userId) {
    return res.status(403).json({ error: "You can only delete your own recipes" });
  }

  await recipesCollection().deleteOne({ id: recipe.id });
  await favoritesCollection().deleteMany({ recipeId: recipe.id }); // clean up orphaned favorites

  res.json({ message: "Recipe deleted" });
});

export default router;
