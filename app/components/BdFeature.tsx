"use client";

import Link from "next/link";
import type { Product } from "@/lib/products-types";

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

export default function BdFeature({ product }: { product: Product }) {
  return (
    <Link
      href={`/bd/${product.id}`}
      className="block bg-[#181614] text-[#FAFAF8] p-10 md:p-16 grid md:grid-cols-[0.85fr_1.15fr] gap-12 items-center group"
    >
      <div className="relative aspect-[3/4.2] bg-gradient-to-br from-[#2A2622] to-[#181614] border border-[#3A3631] overflow-hidden">
        {product.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.images[0]}
            alt={product.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <svg viewBox="0 0 300 420" className="w-full h-full">
            <rect width="300" height="420" fill="#181614" />
            <circle cx="150" cy="160" r="70" fill="#B23A24" />
            <path d="M0 260 Q150 220 300 255 L300 420 L0 420 Z" fill="#2A2622" />
            <line x1="40" y1="350" x2="260" y2="350" stroke="#8C8780" strokeWidth="1" />
          </svg>
        )}
        {product.images.length > 1 && (
          <span className="absolute bottom-3 right-3 font-mono text-[10px] bg-[#FAFAF8] text-[#181614] px-2 py-1">
            +{product.images.length - 1} photo{product.images.length > 2 ? "s" : ""}
          </span>
        )}
      </div>
      <div>
        <div className="text-[12px] uppercase tracking-[0.14em] text-[#B23A24] font-semibold mb-4">
          Bande dessinée — exemplaire dédicacé
        </div>
        <h3 className="font-serif text-[32px] mb-4 group-hover:text-[#E8D9D3] transition-colors">
          {product.title}
        </h3>
        <p className="text-[15.5px] text-[#C7C2B8] max-w-[480px] mb-2">
          {product.description || `${product.medium}. Chaque exemplaire commandé ici est dédicacé et personnalisé à la main avant l'envoi.`}
        </p>
        <p className="text-[15.5px] text-[#C7C2B8] max-w-[480px]">
          Dis-moi simplement ce que tu veux voir dans le dessin — un personnage, un prénom, une
          scène — et je le glisse dans ta dédicace.
        </p>
        <div className="flex items-center gap-5 mt-7 flex-wrap">
          <span className="font-mono text-[22px]">{fmt(product.price)}</span>
          <span className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold bg-[#FAFAF8] text-[#181614] group-hover:bg-[#B23A24] group-hover:text-white transition-colors">
            Voir la fiche complète
          </span>
        </div>
        <div className="text-[12.5px] text-[#8C8780] border-l-2 border-[#B23A24] pl-3 mt-5 max-w-[420px]">
          Délai d&rsquo;expédition : 3 à 5 jours, le temps de dessiner ta dédicace.
        </div>
      </div>
    </Link>
  );
}
