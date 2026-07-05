import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import { getAllProductsAsync, createProduct, emptyDeliveryOptions } from "@/lib/products";

export async function GET() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const products = await getAllProductsAsync();
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.title) {
    return NextResponse.json({ error: "Le titre est obligatoire." }, { status: 400 });
  }

  try {
    const product = await createProduct({
      title: body.title,
      type: body.type || "print",
      medium: body.medium || "",
      size: body.size || "",
      edition: body.edition || "",
      price: body.price || 0,
      description: body.description || "",
      images: Array.isArray(body.images) ? body.images : [],
      imagesOriginal: Array.isArray(body.imagesOriginal) ? body.imagesOriginal : [],
      imagesPrint: Array.isArray(body.imagesPrint) ? body.imagesPrint : [],
      photoTags: body.photoTags || {},
      allowDedication: !!body.allowDedication,
      active: body.active !== false,
      featured: !!body.featured,
      wallPreviewEnabled: !!body.wallPreviewEnabled,
      delivery: body.delivery ?? emptyDeliveryOptions(),
      linkedProductId: body.linkedProductId || undefined,
      temporaryUntil: body.temporaryUntil || undefined,
      retireAt: body.retireAt || undefined,
      editionTotal: body.editionTotal || 0,
      editionSold: body.editionSold || 0,
    });
    return NextResponse.json({ product }, { status: 201 });
  } catch (err) {
    console.error("[Products POST] Erreur:", err);
    return NextResponse.json({ error: "Erreur création produit: " + String(err) }, { status: 500 });
  }
}
