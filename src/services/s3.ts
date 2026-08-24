import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "crypto";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const ALLOWED_CONTENT_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const s3Client = new S3Client({ region: REGION });

export function isAllowedImageContentType(contentType: string): boolean {
  return contentType in ALLOWED_CONTENT_TYPES;
}

// Presigned PUT URL so the browser can upload the photo directly to S3,
// bypassing API Gateway/Lambda payload size limits.
export async function createPresignedUploadUrl(
  contentType: string,
): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  const extension = ALLOWED_CONTENT_TYPES[contentType];
  const key = `recipes/${randomUUID()}.${extension}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });
  const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

  return { uploadUrl, publicUrl, key };
}

// Presigned GET URL for retrieving a photo without making the bucket public.
export async function createPresignedDownloadUrl(key: string): Promise<string> {
  if (!BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
  return getSignedUrl(s3Client, command, { expiresIn: 3600 });
}
