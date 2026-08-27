import { ObjectId } from "mongodb";

export interface Recipe {
  id: string;
  title: string;
  ingredients: string[]; // max 10, enforced in validation
  instructions: string[]; // max 10, enforced in validation
  prepTimeMin: number;
  cookTimeMin: number;
  totalTimeMin: number;
  tag: string;
  imageUrl?: string;
  warningNote?: string;
  createdAt: string;
  isUserUpload: boolean;
  inMyBox: boolean;
  servings: number;
  difficulty?: "trivial" | "medium" | "high";
}

export interface RecipeDocument extends Recipe {
  _id?: ObjectId;
  createdBy: ObjectId | null;
  createdByDisplayName?: string;
  updatedAt: Date;
  favoriteCount: number;
}

export interface User {
  _id?: ObjectId;
  email: string;
  passwordHash: string;
  displayName: string;
  createdAt: Date;
  emailVerified: boolean;
}

// Shared shape for a short-lived, single-use token tied to a user — used for
// both the password-reset and email-verification flows, which are otherwise
// identical in how they're issued, hashed, looked up, and expired.
export interface AuthToken {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PasswordResetToken extends AuthToken {}

export interface EmailVerificationToken extends AuthToken {}

export interface Favorite {
  _id?: ObjectId;
  userId: ObjectId;
  recipeId: string;
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
      // Set by loadCurrentUser once the JWT payload has been resolved to an
      // actual user document, so downstream middleware/handlers can reuse it
      // instead of each re-querying the database for the same record.
      currentUser?: User;
    }
  }
}
