import { S3Client, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;
const PUBLIC_URL_PREFIX = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/`;
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024; // 8 MB — plenty for a recipe photo

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const s3Client = new S3Client({ region: REGION });

export function isAllowedImageContentType(contentType: string): boolean {
  return contentType in ALLOWED_CONTENT_TYPES;
}

// Presigned POST policy so the browser can upload the photo directly to S3,
// bypassing API Gateway/Lambda payload size limits, while S3 itself enforces
// the content type and a max file size (a plain presigned PUT URL can't cap size).
export async function createPresignedUploadUrl(
  contentType: string,
): Promise<{ uploadUrl: string; fields: Record<string, string>; publicUrl: string; key: string }> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  const extension = ALLOWED_CONTENT_TYPES[contentType];
  const key = `recipes/${randomUUID()}.${extension}`;

  const { url, fields } = await createPresignedPost(s3Client, {
    Bucket: BUCKET_NAME,
    Key: key,
    Conditions: [
      ["content-length-range", 0, MAX_UPLOAD_BYTES],
      ["eq", "$Content-Type", contentType],
    ],
    Fields: {
      "Content-Type": contentType,
    },
    Expires: 300,
  });

  const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

  return { uploadUrl: url, fields, publicUrl, key };
}

// Presigned GET URL for retrieving a photo without making the bucket public.
export async function createPresignedDownloadUrl(key: string): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

// Deletes the photo behind a recipe's imageUrl, if it points at our bucket.
export async function deleteImageByUrl(imageUrl: string): Promise<void> {
  if (!BUCKET_NAME || !imageUrl.startsWith(PUBLIC_URL_PREFIX)) {
    return;
  }

  const key = imageUrl.slice(PUBLIC_URL_PREFIX.length);
  await s3Client.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
}
