import Link from "next/link";
import { Suspense } from "react";
import ProductForm from "../ProductForm";

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="border-b border-[#DEDAD1] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin/products" className="text-sm text-[#8C8780] hover:text-[#181614]">
            ← Retour
          </Link>
          <h1 className="font-serif text-xl text-[#181614]">Ajouter un produit</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        <Suspense>
          <ProductForm mode="create" />
        </Suspense>
      </main>
    </div>
  );
}
