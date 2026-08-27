import { Router } from "express";
import { ObjectId, Filter } from "mongodb";
import { recipesCollection, favoritesCollection, usersCollection } from "../db";
import { requireAuth, requireVerifiedEmail, attachUserIfPresent } from "../middleware/auth";
import { RecipeDocument } from "../types";
import { deleteImageByUrl } from "../services/s3";

const router = Router();

const MAX_ITEMS = 10;
const MAX_LINE_LENGTH = 500;
const MAX_TITLE_LENGTH = 200;
const MAX_TAG_LENGTH = 50;
const MAX_WARNING_LENGTH = 1000;
const MAX_TIME_MIN = 24 * 60;
const DIFFICULTY_VALUES = ["trivial", "medium", "high"];
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

function isNonEmptyStringArray(value: unknown, maxLength: number): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= MAX_ITEMS &&
    value.every((item) => typeof item === "string" && item.trim().length > 0 && item.length <= maxLength)
  );
}

function isOptionalNonNegativeInt(value: unknown): boolean {
  return (
    value === undefined ||
    (typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= MAX_TIME_MIN)
  );
}

function validateRecipeInput(body: any): string | null {
  if (!body.title || typeof body.title !== "string" || body.title.length > MAX_TITLE_LENGTH)
    return `title is required and must be ${MAX_TITLE_LENGTH} characters or fewer`;
  if (!isNonEmptyStringArray(body.ingredients, MAX_LINE_LENGTH))
    return `ingredients must be 1-${MAX_ITEMS} non-empty strings of ${MAX_LINE_LENGTH} characters or fewer`;
  if (!isNonEmptyStringArray(body.instructions, MAX_LINE_LENGTH))
    return `instructions must be 1-${MAX_ITEMS} non-empty strings of ${MAX_LINE_LENGTH} characters or fewer`;
  if (!Number.isInteger(body.servings) || body.servings < 1)
    return "servings must be a positive integer";
  if (!isOptionalNonNegativeInt(body.prepTimeMin))
    return `prepTimeMin must be a non-negative integer no greater than ${MAX_TIME_MIN}`;
  if (!isOptionalNonNegativeInt(body.cookTimeMin))
    return `cookTimeMin must be a non-negative integer no greater than ${MAX_TIME_MIN}`;
  if (body.tag !== undefined && (typeof body.tag !== "string" || body.tag.length === 0 || body.tag.length > MAX_TAG_LENGTH))
    return `tag must be a non-empty string of ${MAX_TAG_LENGTH} characters or fewer`;
  if (body.difficulty !== undefined && !DIFFICULTY_VALUES.includes(body.difficulty))
    return `difficulty must be one of ${DIFFICULTY_VALUES.join(", ")}`;
  if (body.imageUrl !== undefined && typeof body.imageUrl !== "string")
    return "imageUrl must be a string";
  if (body.warningNote !== undefined && (typeof body.warningNote !== "string" || body.warningNote.length > MAX_WARNING_LENGTH))
    return `warningNote must be a string of ${MAX_WARNING_LENGTH} characters or fewer`;
  return null;
}

export function toPublicRecipe(recipe: RecipeDocument, inMyBox = false, isOwnRecipe = false) {
  const { _id, createdBy, updatedAt, ...publicRecipe } = recipe;
  return { ...publicRecipe, inMyBox, isOwnRecipe };
}

// GET /recipes?name=pie&maxIngredients=5&maxTime=30&skip=0&limit=50
// All filters are optional and combinable.
router.get("/", attachUserIfPresent, async (req, res) => {
  const { name, maxIngredients, maxTime, skip, limit } = req.query;

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

  const pageSize = Math.min(Math.max(1, Number(limit) || DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
  const pageSkip = Math.max(0, Number(skip) || 0);

  const recipes = await recipesCollection().find(filter).skip(pageSkip).limit(pageSize).toArray();
  for (let index = recipes.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [recipes[index], recipes[randomIndex]] = [recipes[randomIndex], recipes[index]];
  }

  // If the request is authenticated, flag which of these are favorited
  // and which were uploaded by the current user, so the frontend can
  // render filled/empty hearts and scope "My recipes" to their own uploads.
  if (req.user) {
    const favorites = await favoritesCollection()
      .find({ userId: new ObjectId(req.user.userId), recipeId: { $in: recipes.map((r) => r.id) } })
      .toArray();
    const favoritedIds = new Set(favorites.map((f) => f.recipeId.toString()));

    return res.json(
      recipes.map((r) =>
        toPublicRecipe(r, favoritedIds.has(r.id), r.createdBy?.toString() === req.user!.userId)
      )
    );
  }

  res.json(recipes.map((recipe) => toPublicRecipe(recipe)));
});

// GET /recipes/:id
router.get("/:id", attachUserIfPresent, async (req, res) => {
  const recipe = await recipesCollection().findOne({ id: req.params.id });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });

  if (req.user) {
    const favorite = await favoritesCollection().findOne({
      userId: new ObjectId(req.user.userId),
      recipeId: recipe.id,
    });
    return res.json(toPublicRecipe(recipe, Boolean(favorite), recipe.createdBy?.toString() === req.user.userId));
  }

  res.json(toPublicRecipe(recipe));
});

// POST /recipes — requires login
router.post("/", requireAuth, requireVerifiedEmail, async (req, res) => {
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
  res.status(201).json(toPublicRecipe({ ...newRecipe, _id: result.insertedId }, false, true));
});

// PUT /recipes/:id — requires login, only the original uploader can edit
router.put("/:id", requireAuth, requireVerifiedEmail, async (req, res) => {
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

  // Only remove the old photo once the new recipe data is safely persisted.
  if (recipe.imageUrl && recipe.imageUrl !== imageUrl) {
    await deleteImageByUrl(recipe.imageUrl).catch((error) =>
      console.error("Failed to delete replaced recipe image", error),
    );
  }

  res.json({ message: "Recipe updated" });
});

// DELETE /recipes/:id — requires login, only the original uploader can delete
router.delete("/:id", requireAuth, requireVerifiedEmail, async (req, res) => {
  const recipe = await recipesCollection().findOne({ id: req.params.id });
  if (!recipe) return res.status(404).json({ error: "Recipe not found" });
  if (recipe.createdBy?.toString() !== req.user!.userId) {
    return res.status(403).json({ error: "You can only delete your own recipes" });
  }

  await recipesCollection().deleteOne({ id: recipe.id });
  await favoritesCollection().deleteMany({ recipeId: recipe.id }); // clean up orphaned favorites

  if (recipe.imageUrl) {
    await deleteImageByUrl(recipe.imageUrl).catch((error) =>
      console.error("Failed to delete recipe image", error),
    );
  }

  res.json({ message: "Recipe deleted" });
});

export default router;
