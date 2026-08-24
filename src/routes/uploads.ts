import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createPresignedUploadUrl,
  createPresignedDownloadUrl,
  isAllowedImageContentType,
} from "../services/s3";

const router = Router();

// POST /uploads/presign — requires login, returns a short-lived S3 PUT URL
// the client uploads the photo to directly, plus the public URL to save on the recipe.
router.post("/presign", requireAuth, async (req, res) => {
  const { contentType } = req.body;

  if (typeof contentType !== "string" || !isAllowedImageContentType(contentType)) {
    return res.status(400).json({ error: "contentType must be image/jpeg, image/png, or image/webp" });
  }

  try {
    const { uploadUrl, publicUrl, key } = await createPresignedUploadUrl(contentType);
    res.json({ uploadUrl, publicUrl, key });
  } catch (error) {
    console.error("Failed to create presigned upload URL", error);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
});

// GET /uploads/view?key=recipes/xyz.jpg — returns a short-lived S3 GET URL
// for displaying a photo without making the bucket public.
router.get("/view", async (req, res) => {
  const { key } = req.query;

  if (typeof key !== "string" || !key) {
    return res.status(400).json({ error: "key query parameter is required" });
  }

  try {
    const url = await createPresignedDownloadUrl(key);
    res.json({ url });
  } catch (error) {
    console.error("Failed to create presigned download URL", error);
    res.status(500).json({ error: "Failed to create download URL" });
  }
});

export default router;
