import { Router } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { usersCollection } from "../db";
import { JWT_SECRET, requireAuth } from "../middleware/auth";

const router = Router();

function authResponse(token: string, email: string, displayName: string) {
  return { token, user: { email, displayName } };
}

function userResponse(user: { email: string; displayName: string }) {
  return { user: { email: user.email, displayName: user.displayName } };
}

// POST /auth/signup
router.post("/signup", async (req, res) => {
  const { email, password, displayName } = req.body;

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
  const { email, password } = req.body;

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

// GET /auth/me - verify the current API session and return its user
router.get("/me", requireAuth, async (req, res) => {
  const user = await usersCollection().findOne({ email: req.user!.email });
  if (!user) return res.status(401).json({ error: "User account not found" });

  res.json(userResponse(user));
});

export default router;
