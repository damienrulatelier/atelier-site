"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Product } from "@/lib/products-types";
import { optimizeImage } from "@/lib/cloudinary";
import ImageLightbox from "./ImageLightbox";

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function CountdownLive({ until }: { until: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function tick() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setLabel("Expiré"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h >= 48) { const d = Math.floor(h / 24); setLabel(`${d}j ${h % 24}h`); }
      else if (h >= 1) { setLabel(`${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`); }
      else { setLabel(`${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`); }
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    setUrgent(new Date(until).getTime() - Date.now() < 3600000);
  }, [until]);
  return (
    <span className={`font-mono text-[10px] font-bold px-2 py-0.5 ${urgent ? "bg-[#B23A24] text-white" : "bg-[#181614] text-white"}`}>
      ⏳ {label}
    </span>
  );
}

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

function CountdownLastChance({ until }: { until: string }) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    function tick() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setLabel("Retiré"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h >= 48) { const d = Math.floor(h / 24); setLabel(`${d}j ${h % 24}h`); }
      else { setLabel(`${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`); }
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

function ProductCard({ p, context, onZoom }: { p: Product; context?: string; onZoom: (p: Product) => void }) {
  const [isNew, setIsNew] = useState(false);
  const [showTemporary, setShowTemporary] = useState(false);
  const [showRetire, setShowRetire] = useState(false);

  useEffect(() => {
    const now = Date.now();
    setIsNew(!p.temporaryUntil && p.type !== "drop" && (p.createdAt
      ? now - new Date(p.createdAt).getTime() < 5 * 24 * 60 * 60 * 1000
      : false));
    setShowTemporary(!!p.temporaryUntil && new Date(p.temporaryUntil).getTime() > now);
    setShowRetire(!!p.retireAt && new Date(p.retireAt).getTime() > now);
  }, [p]);

  const isOriginal = p.type === "original";
  const baseHref = isOriginal ? `/originals/${p.id}` : `/prints/${p.id}`;
  const href = context === "originals" ? `${baseHref}?from=originals` : context === "drops" ? `${baseHref}?from=originals` : baseHref;
  const cardClass = ((isOriginal || p.delivery?.original?.enabled) && context === "originals")
    ? "bg-[#FAFAF8] border border-[#B23A24] flex flex-col group"
    : "bg-[#FAFAF8] border border-[#DEDAD1] flex flex-col group";
  const remaining = p.editionTotal > 0 ? Math.max(p.editionTotal - p.editionSold, 0) : null;
  const isSoldOut = remaining !== null && remaining === 0;

  const displayImages = context === "originals" && p.imagesOriginal?.length
    ? p.imagesOriginal
    : context === "drops" && p.imagesOriginal?.length
    ? p.imagesOriginal
    : p.images;

  return (
    <Link
      href={isSoldOut ? "#" : href}
      onClick={isSoldOut ? (e) => e.preventDefault() : undefined}
      className={`${cardClass} break-inside-avoid mb-4 md:mb-6 inline-block w-full ${isSoldOut ? "opacity-60 cursor-not-allowed" : ""}`}
    >
      <div className="relative overflow-hidden">
        {p.edition && !isOriginal && (context === "prints" || context === "drops" || context === "nouveautes") && (
          <span className="absolute top-3.5 right-3.5 font-mono text-[10px] bg-[#FAFAF8] border border-[#DEDAD1] px-2 py-0.5 text-[#3A3631] z-10">
            {p.edition}
          </span>
        )}
        {displayImages[0] ? (
          <>
            <Image src={displayImages[0]} alt={p.title} width={600} height={800} sizes={context === "drops" ? "100vw" : "(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"} className="w-full h-auto block transition-transform duration-500 group-hover:scale-105" loading="eager" />
            {context !== "drops" && (
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onZoom(p); }} aria-label="Zoomer" className="absolute bottom-3 right-3 w-8 h-8 bg-[#FAFAF8] border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] transition-colors z-10 text-sm">🔍</button>
            )}
          </>
        ) : (
          <div className="aspect-square bg-[#F2F0EA] flex items-center justify-center text-[#8C8780] text-xs">Pas de photo</div>
        )}
      </div>
      <div className="p-6 flex flex-col gap-1.5 flex-1">
        <h3 className="font-serif text-[19px] text-[#181614] group-hover:text-[#B23A24] transition-colors">{p.title}</h3>
        <p className="font-mono text-[11.5px] uppercase tracking-wide text-[#8C8780]">
          {p.medium}
          {isOriginal && context === "originals" && p.size ? ` · ${p.size}` : ""}
        </p>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          {context === "originals" ? (
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#B23A24] text-white uppercase tracking-wide">Œuvre originale</span>
          ) : context === "prints" ? (
            <span className="font-mono text-[10px] px-2 py-0.5 border border-[#DEDAD1] text-[#8C8780] uppercase tracking-wide">Print</span>
          ) : context === "drops" ? (
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#181614] text-white uppercase tracking-wide">Drop</span>
          ) : isOriginal ? (
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#B23A24] text-white uppercase tracking-wide">Œuvre originale</span>
          ) : showTemporary ? (
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#181614] text-white uppercase tracking-wide">Drop</span>
          ) : (
            <span className="font-mono text-[10px] px-2 py-0.5 border border-[#DEDAD1] text-[#8C8780] uppercase tracking-wide">Print</span>
          )}
          {isSoldOut && <span className="font-mono text-[10px] px-2 py-0.5 bg-[#3A3631] text-white uppercase tracking-wide">Épuisé</span>}
          {isNew && !isSoldOut && context !== "originals" && (
            <span className="font-mono text-[10px] px-2 py-0.5 bg-[#B23A24] text-white uppercase tracking-wide">✦ Nouveau</span>
          )}
          {showTemporary && <CountdownLive until={p.temporaryUntil!} />}
          {showRetire && <CountdownLastChance until={p.retireAt!} />}
        </div>
        {remaining !== null && (
          <p className="text-[11px] text-[#8C8780]">
            {remaining > 0 ? `${remaining}/${p.editionTotal} restants` : "Édition complète"}
          </p>
        )}
        <div className="mt-auto pt-4">
          <span className="font-mono text-[15px]">dès {fmt(minPrice(p))}</span>
        </div>
      </div>
    </Link>
  );
}

export default function ProductGrid({ products, context }: { products: Product[]; context?: "prints" | "originals" | "drops" | "nouveautes" | "autres" }) {
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);
  return (
    <>
      <div className={context === "drops" ? "grid grid-cols-1 gap-4 md:gap-6" : "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5 xl:gap-6"}>
        {products.map((p) => (
          <ProductCard key={p.id} p={p} context={context} onZoom={setZoomProduct} />
        ))}
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
