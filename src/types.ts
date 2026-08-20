import { ObjectId } from "mongodb";

export interface Ingredient {
  text: string;
}

export interface Recipe {
  _id?: ObjectId;
  title: string;
  slug: string;
  ingredients: Ingredient[]; // max 10, enforced in validation
  ingredientCount: number; // denormalized from ingredients.length
  instructions: string[]; // max 10, enforced in validation
  totalTimeMinutes: number; // denormalized from prep + cook
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  imageUrl: string;
  createdBy: ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  favoriteCount: number;
}

export interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: Date;
}

export interface Favorite {
  _id?: ObjectId;
  userId: ObjectId;
  recipeId: ObjectId;
  createdAt: Date;
}

// Shape of the JWT payload once a user logs in
export interface AuthTokenPayload {
  userId: string;
  email: string;
}

// Augment Express's Request type so req.user is typed after auth middleware runs
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}
