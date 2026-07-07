import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { verifySession } from "@/lib/firebase/verifySession";

// Configure Cloudinary credentials from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Convert file to buffer for uploading
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Determine resource type based on file mimetype
    const isVideo = file.type.startsWith("video/");
    const resourceType = isVideo ? "video" : "image";

    // Upload to Cloudinary using a promise wrapper
    const uploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: resourceType,
          folder: "viral-ai-publisher",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({
      success: true,
      url: uploadResult.secure_url,
      resourceType,
    });
  } catch (err: any) {
    console.error("Cloudinary upload error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to upload file to Cloudinary" },
      { status: 500 }
    );
  }
}
