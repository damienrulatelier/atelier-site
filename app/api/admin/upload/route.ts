import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";

export const maxDuration = 60;

const USE_CLOUDINARY = !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_SECRET);

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Pas de fichier." }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());

  if (USE_CLOUDINARY) {
    const { v2: cloudinary } = await import("cloudinary");
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    const base64 = `data:image/jpeg;base64,${buffer.toString("base64")}`;

    const result = await cloudinary.uploader.upload(base64, {
      folder: "damien-rul-atelier",
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    });

    return NextResponse.json({ url: result.secure_url });
  } else {
    const fs = await import("fs");
    const path = await import("path");
    const sharp = (await import("sharp")).default;

    const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    let finalBuffer: Buffer = buffer as Buffer;
    let finalExt = ext;

    if (["tif", "tiff", "heic", "heif"].includes(ext)) {
      try {
        finalBuffer = await sharp(buffer).jpeg({ quality: 92 }).toBuffer() as Buffer;
        finalExt = "jpg";
      } catch { /* garder original */ }
    }

    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${finalExt}`;
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), finalBuffer);
    return NextResponse.json({ url: `/uploads/${filename}` });
  }
}
