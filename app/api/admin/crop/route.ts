import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import path from "path";
import fs from "fs";

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { imagePath, x, y, w, h } = await req.json();
  const absPath = path.join(process.cwd(), "public", imagePath);
  if (!fs.existsSync(absPath)) {
    return NextResponse.json({ error: "Image introuvable." }, { status: 404 });
  }
  const sharp = (await import("sharp")).default;
  const filename = `${Date.now()}_cropped.jpg`;
  const outPath = path.join(process.cwd(), "public", "uploads", filename);
  await sharp(absPath)
    .extract({ left: Math.round(x), top: Math.round(y), width: Math.round(w), height: Math.round(h) })
    .jpeg({ quality: 92 })
    .toFile(outPath);
  return NextResponse.json({ url: `/uploads/${filename}` });
}
