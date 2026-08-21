import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { createHash, randomBytes } from "crypto";
import { ObjectId } from "mongodb";
import {
  favoritesCollection,
  passwordResetTokensCollection,
  recipesCollection,
  usersCollection,
} from "../db";
import { JWT_SECRET, requireAuth } from "../middleware/auth";
import { sendPasswordResetEmail } from "../services/email";

const router = Router();

function authResponse(token: string, email: string, displayName: string) {
  return { token, user: { email, displayName } };
}

function userResponse(user: { email: string; displayName: string }) {
  return { user: { email: user.email, displayName: user.displayName } };
}

function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password, displayName } = req.body;

  if (!email || !password || !displayName) {
    return res.status(400).json({ error: "email, password, and displayName are required" });
  }

  const users = usersCollection();
  const existing = await users.findOne({ email });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await users.insertOne({
    email,
    passwordHash,
    displayName,
    createdAt: new Date(),
  });

  const token = jwt.sign(
    { userId: result.insertedId.toString(), email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json(authResponse(token, email, displayName));
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const { password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email and password are required" });
  }

  const users = usersCollection();
  const user = await users.findOne({ email });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = jwt.sign(
    { userId: user._id!.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.json(authResponse(token, user.email, user.displayName));
});

// POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const genericResponse = {
    message: "If an account exists for that email, a password reset link has been sent.",
  };

  if (!email) return res.json(genericResponse);

  const user = await usersCollection().findOne({ email });
  if (!user || !user._id) return res.json(genericResponse);

  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
  const tokens = passwordResetTokensCollection();

  await tokens.deleteMany({ userId: user._id });
  await tokens.insertOne({
    userId: user._id,
    tokenHash: hashResetToken(rawToken),
    expiresAt,
    createdAt: new Date(),
  });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
  await sendPasswordResetEmail(user.email, user.displayName, resetUrl);

  return res.json(genericResponse);
});

// POST /auth/reset-password
router.post("/reset-password", async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";

  if (!token || password.length < 8) {
    return res.status(400).json({ error: "A valid token and password of at least 8 characters are required" });
  }

  const resetToken = await passwordResetTokensCollection().findOne({
    tokenHash: hashResetToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!resetToken) return res.status(400).json({ error: "This password reset link is invalid or expired" });

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await usersCollection().updateOne(
    { _id: resetToken.userId },
    { $set: { passwordHash } },
  );
  await passwordResetTokensCollection().deleteOne({ _id: resetToken._id });

  if (result.matchedCount === 0) return res.status(400).json({ error: "This password reset link is invalid or expired" });
  return res.json({ message: "Password updated successfully" });
});

// GET /auth/me - verify the current API session and return its user
router.get("/me", requireAuth, async (req, res) => {
  const user = await usersCollection().findOne({ email: req.user!.email });
  if (!user) return res.status(401).json({ error: "User account not found" });

  res.json(userResponse(user));
});

// PATCH /auth/me - update the current user's display name and/or password
router.patch("/me", requireAuth, async (req, res) => {
  if (!ObjectId.isValid(req.user!.userId)) {
    return res.status(401).json({ error: "Invalid user account" });
  }

  const displayName = typeof req.body.displayName === "string"
    ? req.body.displayName.trim()
    : "";
  const currentPassword = typeof req.body.currentPassword === "string"
    ? req.body.currentPassword
    : "";
  const newPassword = typeof req.body.newPassword === "string"
    ? req.body.newPassword
    : "";

  if (!displayName && !newPassword) {
    return res.status(400).json({ error: "Provide a display name or new password" });
  }
  if (displayName && (displayName.length < 2 || displayName.length > 50)) {
    return res.status(400).json({ error: "Display name must be between 2 and 50 characters" });
  }
  if (newPassword && (!currentPassword || newPassword.length < 8)) {
    return res.status(400).json({ error: "Current password is required and the new password must be at least 8 characters" });
  }

  const userId = new ObjectId(req.user!.userId);
  const user = await usersCollection().findOne({ _id: userId });
  if (!user) return res.status(404).json({ error: "User account not found" });

  if (newPassword && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const updates: { displayName?: string; passwordHash?: string } = {};
  if (displayName) updates.displayName = displayName;
  if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 10);

  await usersCollection().updateOne({ _id: userId }, { $set: updates });
  return res.json(userResponse({
    email: user.email,
    displayName: updates.displayName || user.displayName,
  }));
});

// DELETE /auth/me - permanently remove the account and its owned data
router.delete("/me", requireAuth, async (req, res) => {
  if (!ObjectId.isValid(req.user!.userId)) {
    return res.status(401).json({ error: "Invalid user account" });
  }

  const userId = new ObjectId(req.user!.userId);
  const recipes = await recipesCollection()
    .find({ createdBy: userId }, { projection: { id: 1 } })
    .toArray();
  const recipeIds = recipes.map((recipe) => recipe.id);

  await favoritesCollection().deleteMany({ userId });
  if (recipeIds.length > 0) {
    await favoritesCollection().deleteMany({ recipeId: { $in: recipeIds } });
  }
  await recipesCollection().deleteMany({ createdBy: userId });

  const result = await usersCollection().deleteOne({ _id: userId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "User account not found" });
  }

  res.json({ message: "Account deleted" });
});

export default router;
