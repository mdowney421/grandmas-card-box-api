import { Router } from "express";
import { ObjectId } from "mongodb";
import { usersCollection } from "../db";
import { attachUserIfPresent } from "../middleware/auth";
import { rateLimit } from "../middleware/rateLimit";
import { sendFeedbackEmail } from "../services/email";

const router = Router();

const TYPE_LABELS: Record<string, string> = {
  comment: "Comment",
  bug: "Bug report",
  feature: "Feature request",
};

const MAX_MESSAGE_LENGTH = 4000;

// Feedback has no other cost gate (unlike auth), so it's the one route a
// spammer could hammer for free — cap it per IP same as the email-sending
// auth endpoints.
const feedbackLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 5 });

// POST /feedback — logged-in or anonymous. When logged in, the reply-to
// address is the account's own verified email rather than whatever the
// client claims, so a submitted "email" field is only used for anonymous
// visitors who want a reply.
router.post("/", feedbackLimit, attachUserIfPresent, async (req, res) => {
  const { type, message, email, company } = req.body as {
    type?: string;
    message?: string;
    email?: string;
    company?: string;
  };

  // Honeypot: this field is hidden from real users via CSS, so anything
  // filling it in is almost certainly a bot. Pretend to succeed either way.
  if (company) {
    return res.json({ ok: true });
  }

  const trimmedMessage = message?.trim();
  if (!trimmedMessage) {
    return res.status(400).json({ error: "Please include a message." });
  }
  if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ error: "Message is too long." });
  }

  const feedbackType = type && type in TYPE_LABELS ? type : "comment";

  let fromEmail = email?.trim() || undefined;
  if (req.user && ObjectId.isValid(req.user.userId)) {
    const user = await usersCollection().findOne({ _id: new ObjectId(req.user.userId) });
    if (user) fromEmail = user.email;
  }

  try {
    await sendFeedbackEmail(TYPE_LABELS[feedbackType], trimmedMessage, fromEmail);
  } catch (error) {
    console.error("Failed to send feedback email:", error);
    return res.status(502).json({ error: "Couldn't send your message. Please try again." });
  }

  res.json({ ok: true });
});

export default router;
