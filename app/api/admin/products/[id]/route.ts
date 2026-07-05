import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/require-admin";
import { updateProduct, deleteProduct, getProductByIdAsync } from "@/lib/products";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  const product = await getProductByIdAsync(id);
  if (!product) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
  return NextResponse.json({ product });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });

  try {
    const updated = await updateProduct(id, body);
    if (!updated) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    return NextResponse.json({ product: updated });
  } catch (err) {
    console.error("[Products PATCH] Erreur:", err);
    return NextResponse.json({ error: "Erreur mise à jour: " + String(err) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const { id } = await params;
  try {
    const ok = await deleteProduct(id);
    if (!ok) return NextResponse.json({ error: "Produit introuvable." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Erreur suppression: " + String(err) }, { status: 500 });
  }
}
