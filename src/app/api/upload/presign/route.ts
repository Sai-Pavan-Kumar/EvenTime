import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Extract the required variables from the request body
    const { fileName, contentType, fileSize } = await request.json();

    // SECURITY FIX 1: Validate File Type (Only Images)
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!contentType || !allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPEG, PNG, WEBP are allowed." },
        { status: 400 }
      );
    }

    // SECURITY FIX 2: Validate File Extension
    const fileExtension = fileName?.split('.').pop()?.toLowerCase();
    const allowedExtensions = ["jpg", "jpeg", "png", "webp"];
    if (!fileExtension || !allowedExtensions.includes(fileExtension)) {
      return NextResponse.json(
        { error: "Invalid file extension. Only image files are allowed." },
        { status: 400 }
      );
    }

    // SECURITY FIX 3: File Size Limit (Max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (!fileSize || fileSize > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 5MB limit or is missing." },
        { status: 400 }
      );
    }

    // SECURITY FIX 4: Server-generated Key (Prevent Path Traversal / Key Injection)
    const safeKey = `events/${randomUUID()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: safeKey,
      ContentType: contentType,
      // CRITICAL FIX: This caches the image in the browser for 1 year, saving Class B Operations!
      CacheControl: "public, max-age=31536000, immutable", 
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${safeKey}`;

    return NextResponse.json({ uploadUrl, publicUrl });
    
  } catch (error) {
    console.error("Presign URL generation failed:", error);
    return NextResponse.json(
      { error: "Failed to generate secure upload URL" },
      { status: 500 }
    );
  }
}