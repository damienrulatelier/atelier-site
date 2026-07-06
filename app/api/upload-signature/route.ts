import { NextResponse } from "next/server";
import crypto from "crypto";

// Route publique pour générer une signature Cloudinary
// Utilisée par le formulaire de commission pour uploader la photo de référence
export async function GET() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: "Cloudinary non configuré." }, { status: 500 });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "damien-rul-atelier/commissions";
  const signature = crypto
    .createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");

  return NextResponse.json({ cloudName, apiKey, timestamp, signature, folder });
}
