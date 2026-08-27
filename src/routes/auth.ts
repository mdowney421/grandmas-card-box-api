import { Router } from "express";
import bcrypt from "bcrypt";
import { createHash, randomBytes } from "crypto";
import { Collection, ObjectId } from "mongodb";
import {
  emailVerificationTokensCollection,
  favoritesCollection,
  passwordResetTokensCollection,
  recipesCollection,
  usersCollection,
} from "../db";
import { signAuthToken, requireAuth, loadCurrentUser } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { AuthToken } from "../types";
import { sendPasswordResetEmail, sendVerificationEmail } from "../services/email";

const router = Router();

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 30 * 60 * 1000;

// Auth endpoints that could otherwise be used to brute-force logins or
// email-bomb an address get a per-IP-per-route limit.
const authAttemptLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const emailSendLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

function authResponse(
  token: string,
  email: string,
  displayName: string,
  emailVerified: boolean,
) {
  return { token, user: { email, displayName, emailVerified } };
}

function userResponse(user: { email: string; displayName: string; emailVerified: boolean }) {
  return {
    user: {
      email: user.email,
      displayName: user.displayName,
      emailVerified: Boolean(user.emailVerified),
    },
  };
}

function normalizeEmail(value: unknown): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

// Issues a fresh single-use token for a user, replacing any of theirs still
// outstanding in the same collection. Shared by the password-reset and
// email-verification flows, which are otherwise identical in shape.
async function issueToken<T extends AuthToken>(
  tokens: Collection<T>,
  userId: ObjectId,
  ttlMs: number,
): Promise<string> {
  const rawToken = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + ttlMs);

  await tokens.deleteMany({ userId } as any);
  await tokens.insertOne({ userId, tokenHash: hashToken(rawToken), expiresAt, createdAt: new Date() } as any);

  return rawToken;
}

async function issueVerificationEmail(userId: ObjectId, email: string, displayName: string) {
  const rawToken = await issueToken(emailVerificationTokensCollection(), userId, EMAIL_VERIFICATION_TTL_MS);
  const verifyUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/verify-email?token=${rawToken}`;
  await sendVerificationEmail(email, displayName, verifyUrl);
}

// POST /auth/signup
router.post("/signup", authAttemptLimit, async (req, res) => {
  const email = normalizeEmail(req.body.email);
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
    emailVerified: false,
  });

  const token = signAuthToken({ userId: result.insertedId.toString(), email });

  try {
    await issueVerificationEmail(result.insertedId, email, displayName);
  } catch (error) {
    // Don't fail signup if the verification email can't be sent — the user can request another.
    console.error("Failed to send verification email:", error);
  }

  res.status(201).json(authResponse(token, email, displayName, false));
});

// POST /auth/login
router.post("/login", authAttemptLimit, async (req, res) => {
  const email = normalizeEmail(req.body.email);
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

  const token = signAuthToken({ userId: user._id!.toString(), email: user.email });

  res.json(authResponse(token, user.email, user.displayName, Boolean(user.emailVerified)));
});

// POST /auth/forgot-password
router.post("/forgot-password", emailSendLimit, async (req, res) => {
  const email = normalizeEmail(req.body.email);
  const genericResponse = {
    message: "If an account exists for that email, a password reset link has been sent.",
  };

  if (!email) return res.json(genericResponse);

  const user = await usersCollection().findOne({ email });
  if (!user || !user._id) return res.json(genericResponse);

  const rawToken = await issueToken(passwordResetTokensCollection(), user._id, PASSWORD_RESET_TTL_MS);
  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password?token=${rawToken}`;
  try {
    await sendPasswordResetEmail(user.email, user.displayName, resetUrl);
  } catch (error) {
    // Don't leak email delivery failures — the response stays generic either way.
    console.error("Failed to send password reset email:", error);
  }

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
    tokenHash: hashToken(token),
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

// POST /auth/verify-email
router.post("/verify-email", async (req, res) => {
  const token = typeof req.body.token === "string" ? req.body.token : "";
  if (!token) return res.status(400).json({ error: "A verification token is required" });

  const verificationToken = await emailVerificationTokensCollection().findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!verificationToken) {
    return res.status(400).json({ error: "This verification link is invalid or expired" });
  }

  const result = await usersCollection().updateOne(
    { _id: verificationToken.userId },
    { $set: { emailVerified: true } },
  );
  await emailVerificationTokensCollection().deleteMany({ userId: verificationToken.userId });

  if (result.matchedCount === 0) return res.status(400).json({ error: "This verification link is invalid or expired" });
  return res.json({ message: "Email verified successfully" });
});

// POST /auth/resend-verification
router.post("/resend-verification", emailSendLimit, requireAuth, loadCurrentUser, async (req, res) => {
  const user = req.currentUser!;

  if (user.emailVerified) {
    return res.status(400).json({ error: "This email address is already verified" });
  }

  try {
    await issueVerificationEmail(user._id!, user.email, user.displayName);
  } catch (error) {
    console.error("Failed to send verification email:", error);
    return res.status(500).json({ error: "Failed to send verification email" });
  }

  return res.json({ message: "Verification email sent" });
});

// GET /auth/me - verify the current API session and return its user
router.get("/me", requireAuth, loadCurrentUser, async (req, res) => {
  res.json(userResponse(req.currentUser!));
});

// PATCH /auth/me - update the current user's display name and/or password
router.patch("/me", requireAuth, loadCurrentUser, async (req, res) => {
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

  const user = req.currentUser!;
  const userId = user._id!;

  if (newPassword && !(await bcrypt.compare(currentPassword, user.passwordHash))) {
    return res.status(401).json({ error: "Current password is incorrect" });
  }

  const updates: { displayName?: string; passwordHash?: string } = {};
  if (displayName) updates.displayName = displayName;
  if (newPassword) updates.passwordHash = await bcrypt.hash(newPassword, 10);

  await usersCollection().updateOne({ _id: userId }, { $set: updates });
  if (updates.displayName) {
    await recipesCollection().updateMany(
      { createdBy: userId },
      { $set: { createdByDisplayName: updates.displayName } },
    );
  }
  return res.json(userResponse({
    email: user.email,
    displayName: updates.displayName || user.displayName,
    emailVerified: Boolean(user.emailVerified),
  }));
});

// DELETE /auth/me - permanently remove the account and its owned data
router.delete("/me", requireAuth, loadCurrentUser, async (req, res) => {
  const userId = req.currentUser!._id!;

  const recipes = await recipesCollection()
    .find({ createdBy: userId }, { projection: { id: 1 } })
    .toArray();
  const recipeIds = recipes.map((recipe) => recipe.id);

  await favoritesCollection().deleteMany({ userId });
  if (recipeIds.length > 0) {
    await favoritesCollection().deleteMany({ recipeId: { $in: recipeIds } });
  }
  await recipesCollection().deleteMany({ createdBy: userId });
  await emailVerificationTokensCollection().deleteMany({ userId });

  const result = await usersCollection().deleteOne({ _id: userId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: "User account not found" });
  }

  res.json({ message: "Account deleted" });
});

export default router;
