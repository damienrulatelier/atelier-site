"use client";

import { useEffect, useState } from "react";
import type { Product } from "@/lib/products-types";
import ProductGrid from "../../components/ProductGrid";

export default function NouveautesPage() {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        // Priorité aux produits marqués isNew par l'artiste,
        // sinon les plus récents (30 derniers jours)
        const all = (data.products || []).filter((p: Product) => p.active && p.type !== "bd");
        const marked = all.filter((p: Product) => p.isNew);
        const recent = all
          .filter((p: Product) => !p.isNew && Date.now() - new Date(p.createdAt).getTime() < 5 * 24 * 60 * 60 * 1000)
          .sort((a: Product, b: Product) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setProducts([...marked, ...recent]);
      });
  }, []);

  return (
    <main className="max-w-6xl mx-auto px-6 md:px-8 py-16">
      <div className="flex items-baseline justify-between mb-3 border-b border-[#B23A24] pb-6">
        <div>
          <h1 className="font-serif text-[34px] text-[#181614]">✦ Nouveautés</h1>
          <p className="text-sm text-[#8C8780] mt-1">Sélectionnées par l&rsquo;artiste</p>
        </div>
        <span className="font-mono text-sm text-[#8C8780]">
          {products ? `${products.length} pièce${products.length !== 1 ? "s" : ""}` : ""}
        </span>
      </div>

      {!products ? (
        <p className="text-sm text-[#8C8780] mt-8">Chargement…</p>
      ) : products.length === 0 ? (
        <p className="text-sm text-[#8C8780] mt-8">Rien de nouveau pour l&rsquo;instant — repasse bientôt !</p>
      ) : (
        <div className="mt-10">
          <ProductGrid products={products} context="nouveautes" />
        </div>
      )}
    </main>
  );
}
