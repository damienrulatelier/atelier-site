"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
import ImageLightbox from "../../../components/ImageLightbox";
import AddToCartModal from "../../../components/AddToCartModal";
import ProductReviews from "../../../components/ProductReviews";

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function minPrice(p: Product): number {
  if (!p.delivery) return p.price || 0;
  const d = p.delivery;
  const prices: number[] = [];
  if (d.email?.enabled) prices.push(d.email.price);
  if (d.original?.enabled) prices.push(d.original.price);
  if (d.originalEmail?.enabled) prices.push(d.originalEmail.price);
  for (const key of ["print", "printEmail", "originalPrint", "originalPrintEmail"] as const) {
    if (d[key]?.enabled) {
      const sizes = d[key].sizes;
      for (const s of ["A6", "A5", "A4", "A3", "A2"] as const) {
        if (sizes[s]?.enabled) prices.push(sizes[s].price);
      }
    }
  }
  return prices.length ? Math.min(...prices.filter((v) => v > 0)) : (p.price || 0);
}

export default function OriginalDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [linked, setLinked] = useState<Product | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const all: Product[] = data.products || [];
        setAllProducts(all);
        const found = all.find((p) => p.id === id && (p.type === "original" || p.delivery?.original?.enabled));
        if (!found) { setLoading(false); return; }
        setProduct(found);
        if (found.linkedProductId) {
          const linkedProduct = all.find((p) => p.id === found.linkedProductId);
          setLinked(linkedProduct || null);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <main className="py-24 text-center text-sm text-[#8C8780]">Chargement…</main>;
  if (!product) return (
    <main className="py-24 text-center">
      <p className="text-[#8C8780] mb-4">Œuvre introuvable.</p>
      <Link href="/" className="text-sm underline">Retour à la boutique</Link>
    </main>
  );

  const otherOriginals = allProducts.filter((p) => (p.type === "original" || p.delivery?.original?.enabled) && p.id !== id && p.active);

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="text-xs uppercase tracking-wide text-[#8C8780] hover:text-[#181614] mb-8 flex items-center gap-2"
        >
          ← Retour
        </button>

        <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-start">
          {/* Colonne image */}
          <div>
            <button
              onClick={() => product.images.length > 0 && setZoomOpen(true)}
              className="w-full bg-[#F2F0EA] border border-[#B23A24] relative overflow-hidden cursor-zoom-in block"
            >
              <span className="absolute top-4 left-4 font-mono text-[10px] px-2 py-0.5 z-10 border bg-[#B23A24] text-white border-[#B23A24]">
                ORIGINAL
              </span>
              {product.images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[activeImage]}
                  alt={product.title}
                  className="w-full h-auto block"
                />
              ) : (
                <div className="aspect-square flex items-center justify-center text-[#8C8780] text-xs">
                  Pas de photo
                </div>
              )}
            </button>

            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`w-14 h-14 overflow-hidden border ${activeImage === i ? "border-[#B23A24]" : "border-[#DEDAD1]"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Colonne infos */}
          <div className="sticky top-24">
            <p className="text-[#B23A24] font-medium text-xs uppercase tracking-wide mb-2">Pièce unique</p>
            <h1 className="font-serif text-[32px] md:text-[38px] text-[#181614] leading-tight mb-3">
              {product.title}
            </h1>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[#8C8780] mb-6">
              {product.medium}
              {product.size ? ` · ${product.size}` : ""}
            </p>

            {product.description && (
              <p className="text-[15.5px] text-[#3A3631] leading-relaxed mb-8 whitespace-pre-line">
                {product.description}
              </p>
            )}

            <p className="font-mono text-2xl font-semibold text-[#181614] mb-6">
              dès {fmt(minPrice(product))}
            </p>

            <button
              onClick={() => setAddOpen(true)}
              className="w-full md:w-auto px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#B23A24] text-white hover:bg-[#181614] transition-colors mb-4"
            >
              Choisir une option et ajouter au panier
            </button>

            {/* Lien croisé vers le print correspondant */}
            {linked && (
              <div className="mt-6 p-4 border border-[#DEDAD1] bg-[#F2F0EA]">
                <p className="text-xs uppercase tracking-wide font-semibold text-[#8C8780] mb-2">
                  Reproduction disponible
                </p>
                <Link href={`/prints/${linked.id}`} className="flex items-center gap-3 group">
                  {linked.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={linked.images[0]} alt={linked.title} className="w-12 h-12 object-cover border border-[#DEDAD1]" />
                  )}
                  <div>
                    <p className="text-sm font-medium group-hover:text-[#B23A24] transition-colors">{linked.title}</p>
                    <p className="text-xs text-[#8C8780]">Tirage numéroté — dès {fmt(minPrice(linked))}</p>
                  </div>
                </Link>
              </div>
            )}

            <ProductReviews productTitle={product.title} />
          </div>
        </div>
      </div>

      {/* Autres originaux */}
      {otherOriginals.length > 0 && (
        <section className="border-t border-[#DEDAD1] bg-[#F2F0EA] py-14 mt-10">
          <div className="max-w-6xl mx-auto px-8">
            <h2 className="font-serif text-2xl text-[#181614] mb-8">Autres œuvres originales</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {otherOriginals.slice(0, 3).map((p) => (
                <Link key={p.id} href={`/originals/${p.id}`} className="border border-[#B23A24] bg-[#FAFAF8] group">
                  {p.images[0] && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.images[0]} alt={p.title} className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105" />
                  )}
                  <div className="p-4">
                    <h3 className="font-serif text-[16px] text-[#181614] group-hover:text-[#B23A24] transition-colors">{p.title}</h3>
                    <p className="font-mono text-xs text-[#8C8780]">dès {fmt(minPrice(p))}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {zoomOpen && (
        <ImageLightbox
          images={product.images}
          title={product.title}
          onClose={() => setZoomOpen(false)}
        />
      )}

      {addOpen && (
        <AddToCartModal product={product} onClose={() => setAddOpen(false)} />
      )}
    </main>
  );
}
