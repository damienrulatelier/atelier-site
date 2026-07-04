import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Dossier séparé de celui de l'admin : ces fichiers viennent du public,
// donc on les isole pour ne jamais les confondre avec les photos de produits.
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "commissions");
const MAX_SIZE = 50 * 1024 * 1024; // 50 Mo par image
const MAX_FILES = 3; // une demande ne peut pas joindre plus de 3 photos

const EXT_BY_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/pjpeg": "jpg",
  "image/png": "png",
  "image/x-png": "png",
  "image/webp": "webp",
};

export async function POST(req: NextRequest) {
  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier reçu." }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES} photos par demande.` },
      { status: 400 }
    );
  }

  fs.mkdirSync(UPLOAD_DIR, { recursive: true });

  const urls: string[] = [];
  for (const file of files) {
    // On accepte tout type MIME commençant par "image/" plutôt qu'une liste
    // stricte : certains navigateurs/systèmes envoient des variantes
    // (image/x-png, image/pjpeg...) pour des fichiers tout à fait valides.
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "Le fichier doit être une image (jpg, png ou webp)." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Une image dépasse 50 Mo." }, { status: 400 });
    }

    const ext = EXT_BY_TYPE[file.type] || file.type.split("/")[1]?.replace(/[^a-z0-9]/gi, "") || "jpg";
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer);
    urls.push(`/uploads/commissions/${filename}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
