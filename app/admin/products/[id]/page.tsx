"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import ProductForm, { ProductFormValues } from "../ProductForm";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  const [initial, setInitial] = useState<ProductFormValues | null>(null);
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/products/${id}`).then(async (res) => {
      if (res.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setInitial(data.product);
    });
  }, [id, router]);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="border-b border-[#DEDAD1] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center gap-4">
          <Link href="/admin/products" className="text-sm text-[#8C8780] hover:text-[#181614]">
            ← Retour
          </Link>
          <h1 className="font-serif text-xl text-[#181614]">Modifier le produit</h1>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-10">
        {notFound ? (
          <p className="text-sm text-[#B23A24]">Ce produit n&rsquo;existe plus.</p>
        ) : initial ? (
          <Suspense><ProductForm mode="edit" initialValues={initial} />
        </Suspense>
        ) : (
          <p className="text-sm text-[#8C8780]">Chargement…</p>
        )}
      </main>
    </div>
  );
}
