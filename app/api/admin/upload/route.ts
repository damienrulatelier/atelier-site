import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import crypto from "crypto";

export const maxDuration = 60;

// Génère une signature pour upload direct depuis le navigateur vers Cloudinary
export async function GET(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary non configuré." }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "damien-rul-atelier";
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder });
}

// Fallback POST pour upload local en dev
export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "Pas de fichier." }, { status: 400 });

  const fs = await import("fs");
  const path = await import("path");
  const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer()) as Buffer;
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
  return NextResponse.json({ url: `/uploads/${filename}` });
}
