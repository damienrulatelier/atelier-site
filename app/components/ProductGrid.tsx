"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products-types";
import ImageLightbox from "./ImageLightbox";

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

// Compte à rebours en temps réel mis à jour chaque seconde.
function CountdownLive({ until }: { until: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setLabel("Expiré"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h >= 48) {
        const d = Math.floor(h / 24);
        setLabel(`${d}j ${h % 24}h`);
      } else if (h >= 1) {
        setLabel(`${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
      } else {
        setLabel(`${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  const diff = new Date(until).getTime() - Date.now();
  const urgent = diff < 3600000; // moins d'1h → rouge

  return (
    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 ${urgent ? "bg-[#B23A24] text-white" : "bg-[#181614] text-white"}`}>
      ⏳ {label}
    </span>
  );
}

// Calcule le prix minimum parmi tous les modes de livraison activés.
function minPrice(p: Product): number {
  if (!p.delivery) return p.price || 0;
  const prices: number[] = [];
  const d = p.delivery;
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

// Compte à rebours "Dernière chance" — produit retiré définitivement à cette date
function CountdownLastChance({ until }: { until: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    function tick() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setLabel("Retiré"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h >= 48) {
        const d = Math.floor(h / 24);
        setLabel(`${d}j ${h % 24}h`);
      } else {
        setLabel(`${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
      }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);

  return (
    <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-[#8C4A00] text-white uppercase tracking-wide">
      ⚠ Dernière chance · {label}
    </span>
  );
}

export default function ProductGrid({ products, context }: { products: Product[]; context?: "prints" | "originals" | "drops" | "nouveautes" | "autres" }) {
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 xl:gap-6">
        {products.map((p) => {
          const isOriginal = p.type === "original";
          const baseHref = isOriginal ? `/originals/${p.id}` : `/prints/${p.id}`;
          const href = context === "originals" ? `${baseHref}?from=originals` : baseHref;
          // Distinction visuelle : bordure terracotta pour les originaux,
          // papier classique pour les prints numérotés.
          // Bordure rouge uniquement dans la section Originaux
          const cardClass = (isOriginal && context === "originals")
            ? "bg-[#FAFAF8] border border-[#B23A24] flex flex-col group"
            : "bg-[#FAFAF8] border border-[#DEDAD1] flex flex-col group";

          const remaining =
            p.editionTotal > 0 ? Math.max(p.editionTotal - p.editionSold, 0) : null;
          const isSoldOut = remaining !== null && remaining === 0;

          // isNew : auto 3 jours — jamais sur un drop
          const isNew = !p.temporaryUntil && (p.createdAt
            ? Date.now() - new Date(p.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000
            : false);

          return (
            <Link
              key={p.id}
              href={isSoldOut ? "#" : href}
              onClick={isSoldOut ? (e) => e.preventDefault() : undefined}
              className={`${cardClass} break-inside-avoid mb-4 md:mb-6 inline-block w-full ${isSoldOut ? "opacity-60 cursor-not-allowed" : ""}`}
            >
              <div className="relative overflow-hidden">
                {/* Numéro d'édition — uniquement dans Prints, Drops et Nouveautés */}
                {p.edition && !isOriginal && (context === "prints" || context === "drops" || context === "nouveautes") && (
                  <span className="absolute top-3.5 right-3.5 font-mono text-[10px] bg-[#FAFAF8] border border-[#DEDAD1] px-2 py-0.5 text-[#3A3631] z-10">
                    {p.edition}
                  </span>
                )}
                {(() => {
                  const displayImages = (context === "originals" && p.imagesOriginal?.length) ? p.imagesOriginal : p.images;
                  return displayImages[0] ? (
                  <>
                    <Image
                      src={displayImages[0]}
                      alt={p.title}
                      width={600}
                      height={800}
                      sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
                      className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setZoomProduct(p);
                      }}
                      aria-label="Zoomer sur l'image"
                      className="absolute bottom-3 right-3 w-8 h-8 bg-[#FAFAF8] border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] transition-colors z-10 text-sm"
                    >
                      🔍
                    </button>
                  </>
                ) : (
                  <div className="aspect-square bg-[#F2F0EA] flex items-center justify-center text-[#8C8780] text-xs">
                    Pas de photo
                  </div>
                )})()}
              </div>
              <div className="p-6 flex flex-col gap-1.5 flex-1">
                <h3 className="font-serif text-[19px] text-[#181614] group-hover:text-[#B23A24] transition-colors">
                  {p.title}
                </h3>
                <p className="font-mono text-[11.5px] uppercase tracking-wide text-[#8C8780]">
                  {p.medium}
                  {isOriginal && context === "originals" && p.size ? ` · ${p.size}` : ""}
                </p>

                {/* Ligne nature + nouveauté + countdown — tout en un, jamais superposé */}
                <div className="flex items-center gap-2 flex-wrap mt-0.5">
                  {/* Badge nature — dépend du contexte d'affichage */}
                  {context === "originals" ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#B23A24] text-white uppercase tracking-wide">
                      Œuvre originale
                    </span>
                  ) : context === "prints" ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#DEDAD1] text-[#8C8780] uppercase tracking-wide">
                      Print
                    </span>
                  ) : context === "drops" ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#181614] text-white uppercase tracking-wide">
                      Drop
                    </span>
                  ) : isOriginal ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#B23A24] text-white uppercase tracking-wide">
                      Œuvre originale
                    </span>
                  ) : p.temporaryUntil && new Date(p.temporaryUntil).getTime() > Date.now() ? (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#181614] text-white uppercase tracking-wide">
                      Drop
                    </span>
                  ) : (
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#DEDAD1] text-[#8C8780] uppercase tracking-wide">
                      Print
                    </span>
                  )}
                  {isSoldOut && (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#3A3631] text-white uppercase tracking-wide">
                      Épuisé
                    </span>
                  )}
                  {isNew && !isSoldOut && context !== "originals" && (
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#B23A24] text-white uppercase tracking-wide">
                      ✦ Nouveau
                    </span>
                  )}
                  {p.temporaryUntil && new Date(p.temporaryUntil).getTime() > Date.now() && (
                    <CountdownLive until={p.temporaryUntil} />
                  )}
                  {p.retireAt && new Date(p.retireAt).getTime() > Date.now() && (
                    <CountdownLastChance until={p.retireAt} />
                  )}
                </div>

                {remaining !== null && (
                  <p className="text-[11px] text-[#8C8780]">
                    {remaining > 0
                      ? `${remaining}/${p.editionTotal} restants`
                      : "Édition complète"}
                  </p>
                )}
                <div className="mt-auto pt-4">
                  <span className="font-mono text-[15px]">
                    dès {fmt(minPrice(p))}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {zoomProduct && (
        <ImageLightbox
          images={zoomProduct.imagesOriginal?.length ? zoomProduct.imagesOriginal : zoomProduct.images}
          title={zoomProduct.title}
          onClose={() => setZoomProduct(null)}
        />
      )}
    </>
  );
}
