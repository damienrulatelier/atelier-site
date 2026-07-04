"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
import ImageLightbox from "../../../components/ImageLightbox";
import AddToCartModal from "../../../components/AddToCartModal";

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

export default function BdDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const found = (data.products || []).find((p: Product) => p.id === id);
        setProduct(found || null);
      });
  }, [id]);

  if (product === undefined) {
    return (
      <main className="bg-[#181614] min-h-screen py-24 text-center text-sm text-[#8C8780]">
        Chargement…
      </main>
    );
  }

  if (product === null) {
    return (
      <main className="bg-[#181614] min-h-screen max-w-xl mx-auto px-8 py-24 text-center">
        <p className="text-[#C7C2B8] mb-4">Cette bande dessinée n&rsquo;est plus disponible.</p>
        <Link href="/" className="text-[#B23A24] underline text-sm">
          Retourner à la boutique
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-[#181614] min-h-screen">
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <button
          onClick={() => router.back()}
          className="text-sm text-[#8C8780] hover:text-[#FAFAF8] mb-6 inline-flex items-center gap-1.5"
        >
          ← Retour
        </button>

        <div className="grid md:grid-cols-2 gap-10 md:gap-14">
          {/* IMAGE */}
          <div>
            <button
              onClick={() => product.images.length > 0 && setZoomOpen(true)}
              className="w-full bg-[#2A2622] border border-[#3A3631] relative overflow-hidden cursor-zoom-in block"
            >
              {product.images[activeImage] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.images[activeImage]}
                  alt={product.title}
                  className="w-full h-auto block"
                />
              ) : (
                <div className="w-full aspect-[3/4.2] flex items-center justify-center text-[#8C8780] text-sm">
                  Pas de photo
                </div>
              )}
            </button>

            {product.images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {product.images.map((img, i) => (
                  <button
                    key={img}
                    onClick={() => setActiveImage(i)}
                    className={`w-16 h-16 border overflow-hidden flex-shrink-0 ${
                      i === activeImage ? "border-[#FAFAF8]" : "border-[#3A3631]"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFOS */}
          <div>
            <div className="text-[12px] uppercase tracking-[0.14em] text-[#B23A24] font-semibold mb-4">
              Bande dessinée — exemplaire dédicacé
            </div>
            <h1 className="font-serif text-[32px] md:text-[38px] leading-tight text-[#FAFAF8] mb-2">
              {product.title}
            </h1>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[#8C8780] mb-6">
              {product.medium}
              {product.size ? ` · ${product.size}` : ""}
              {product.editionTotal > 0
                ? ` · ${Math.max(product.editionTotal - product.editionSold, 0)}/${product.editionTotal} restants`
                : ""}
            </p>

            {product.description ? (
              <p className="text-[15.5px] text-[#C7C2B8] leading-relaxed mb-4 whitespace-pre-line">
                {product.description}
              </p>
            ) : null}
            <p className="text-[15.5px] text-[#C7C2B8] leading-relaxed mb-8">
              Dis-moi simplement ce que tu veux voir dans le dessin — un personnage, un prénom, une
              scène — et je le glisse dans ta dédicace.
            </p>

            <div className="flex items-center gap-5 mb-6 flex-wrap">
              <span className="font-mono text-[22px] text-[#FAFAF8]">{fmt(product.price)}</span>
              <button
                onClick={() => setAddOpen(true)}
                className="px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#FAFAF8] text-[#181614] hover:bg-[#B23A24] hover:text-white transition-colors"
              >
                Commander mon exemplaire
              </button>
            </div>

            <div className="text-[12.5px] text-[#8C8780] border-l-2 border-[#B23A24] pl-3 max-w-[420px]">
              Délai d&rsquo;expédition : 3 à 5 jours, le temps de dessiner ta dédicace.
            </div>
          </div>
        </div>
      </div>

      {zoomOpen && (
        <ImageLightbox
          images={product.images}
          title={product.title}
          onClose={() => setZoomOpen(false)}
        />
      )}

      {addOpen && <AddToCartModal product={product} onClose={() => setAddOpen(false)} />}
    </main>
  );
}
