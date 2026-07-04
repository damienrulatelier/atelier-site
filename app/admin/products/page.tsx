"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Product = {
  id: string;
  title: string;
  type: string;
  price: number;
  images: string[];
  allowDedication: boolean;
  active: boolean;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/products");
    if (res.status === 401) {
      router.push("/admin/login");
      return;
    }
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(p: Product) {
    await fetch(`/api/admin/products/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !p.active }),
    });
    load();
  }

  async function remove(p: Product) {
    if (!confirm(`Retirer définitivement « ${p.title} » ? Cette action est irréversible.`)) return;
    await fetch(`/api/admin/products/${p.id}`, { method: "DELETE" });
    load();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <header className="border-b border-[#DEDAD1] bg-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex items-center justify-between">
          <h1 className="font-serif text-xl text-[#181614]">Mes produits</h1>
          <div className="flex items-center gap-4">
            <Link href="/admin/orders" className="text-sm text-[#8C8780] hover:text-[#181614] underline">
              Commandes
            </Link>
            <Link href="/admin/reviews" className="text-sm text-[#8C8780] hover:text-[#181614] underline">
              Avis
            </Link>
            <Link
              href="/"
              target="_blank"
              className="text-sm text-[#8C8780] hover:text-[#181614] underline"
            >
              Voir la boutique ↗
            </Link>
            <button onClick={logout} className="text-sm text-[#8C8780] hover:text-[#B23A24]">
              Se déconnecter
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex justify-between items-center mb-8">
          <p className="text-sm text-[#8C8780]">
            {products.length} produit{products.length !== 1 ? "s" : ""} au catalogue
          </p>
          <Link
            href="/admin/products/new"
            className="bg-[#181614] text-white px-5 py-2.5 text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors"
          >
            + Ajouter un produit
          </Link>
        </div>

        {loading ? (
          <p className="text-sm text-[#8C8780]">Chargement…</p>
        ) : products.length === 0 ? (
          <div className="border border-dashed border-[#DEDAD1] py-16 text-center">
            <p className="text-[#8C8780] mb-4">Aucun produit pour l&rsquo;instant.</p>
            <Link href="/admin/products/new" className="text-[#B23A24] underline text-sm">
              Ajoute ton premier produit
            </Link>
          </div>
        ) : (
          <div className="border border-[#DEDAD1] bg-white divide-y divide-[#DEDAD1]">
            {products.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-4">
                <div className="w-16 h-16 bg-[#F2F0EA] border border-[#DEDAD1] flex-shrink-0 overflow-hidden">
                  {p.images[0] ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[#181614] truncate">{p.title}</p>
                  <p className="text-xs text-[#8C8780] uppercase tracking-wide">
                    {p.type === "bd" ? "Bande dessinée" : "Print"}
                    {p.allowDedication ? " · Dédicace activée" : ""}
                  </p>
                </div>
                <span className="font-mono text-sm text-[#181614] whitespace-nowrap">
                  {p.price.toFixed(2).replace(".", ",")} €
                </span>
                <button
                  onClick={() => toggleActive(p)}
                  className={`text-xs px-3 py-1.5 border whitespace-nowrap ${
                    p.active
                      ? "border-[#181614] text-[#181614]"
                      : "border-[#DEDAD1] text-[#8C8780]"
                  }`}
                >
                  {p.active ? "En vente" : "Masqué"}
                </button>
                <Link
                  href={`/admin/products/${p.id}`}
                  className="text-xs text-[#3A3631] underline whitespace-nowrap"
                >
                  Modifier
                </Link>
                <button
                  onClick={() => remove(p)}
                  className="text-xs text-[#B23A24] underline whitespace-nowrap"
                >
                  Retirer
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
