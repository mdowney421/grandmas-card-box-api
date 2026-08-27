import { RecipeDocument } from "../types";

// Shapes a stored recipe document into what the API returns: strips internal
// fields (_id, createdBy, updatedAt) and adds the two viewer-relative flags.
// Lives here rather than in a route module so any router can reuse it without
// importing from another router.
export function toPublicRecipe(recipe: RecipeDocument, inMyBox = false, isOwnRecipe = false) {
  const { _id, createdBy, updatedAt, ...publicRecipe } = recipe;
  return { ...publicRecipe, inMyBox, isOwnRecipe };
}
