"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
import Image from "next/image";
import { optimizeImage } from "@/lib/cloudinary";
function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}
function minPrice(p: Product): number {
  if (!p.delivery) return p.price || 0;
  const prices: number[] = [];
  const d = p.delivery;
  if (d.email?.enabled) prices.push(d.email.price);
  if (d.original?.enabled) prices.push(d.original.price);
  for (const key of ["print", "canvas"] as const) {
    if (d[key]?.enabled) {
      const sizes = d[key].sizes;
      for (const s of ["A6","A5","A4","A3","A2"] as const) {
        if (sizes[s]?.enabled) prices.push(sizes[s].price);
      }
    }
  }
  return prices.length ? Math.min(...prices.filter(v => v > 0)) : (p.price || 0);
}
function Countdown({ until }: { until: string }) {
  const [parts, setParts] = useState({ d: 0, h: 0, m: 0, s: 0, expired: false });
  useEffect(() => {
    function tick() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setParts({ d: 0, h: 0, m: 0, s: 0, expired: true }); return; }
      setParts({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
        expired: false,
      });
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [until]);
  if (parts.expired) return <span className="font-mono text-[#8C8780] text-sm">Expiré</span>;
  const urgent = new Date(until).getTime() - Date.now() < 3600000;
  return (
    <div className={`flex items-center gap-3 ${urgent ? "text-[#B23A24]" : "text-[#FAFAF8]"}`}>
      {parts.d > 0 && (
        <div className="text-center">
          <div className="font-mono text-[28px] font-bold leading-none">{String(parts.d).padStart(2,"0")}</div>
          <div className="text-[10px] uppercase tracking-widest text-[#8C8780] mt-1">jours</div>
        </div>
      )}
      {parts.d > 0 && <div className="font-mono text-[20px] text-[#3A3631] pb-4">:</div>}
      <div className="text-center">
        <div className="font-mono text-[28px] font-bold leading-none">{String(parts.h).padStart(2,"0")}</div>
        <div className="text-[10px] uppercase tracking-widest text-[#8C8780] mt-1">heures</div>
      </div>
      <div className="font-mono text-[20px] text-[#3A3631] pb-4">:</div>
      <div className="text-center">
        <div className="font-mono text-[28px] font-bold leading-none">{String(parts.m).padStart(2,"0")}</div>
        <div className="text-[10px] uppercase tracking-widest text-[#8C8780] mt-1">min</div>
      </div>
      <div className="font-mono text-[20px] text-[#3A3631] pb-4">:</div>
      <div className="text-center">
        <div className="font-mono text-[28px] font-bold leading-none">{String(parts.s).padStart(2,"0")}</div>
        <div className="text-[10px] uppercase tracking-widest text-[#8C8780] mt-1">sec</div>
      </div>
    </div>
  );
}
export default function DropFeature({ product }: { product: Product }) {
  const remaining = product.editionTotal > 0 ? Math.max(product.editionTotal - product.editionSold, 0) : null;
  const displayImg = (product.imagesOriginal?.length ? product.imagesOriginal : product.images)[0];
  return (
    <Link
      href={`/prints/${product.id}`}
      className="block bg-[#2A2420] text-[#FAFAF8] p-10 md:p-16 grid md:grid-cols-[1fr_1fr] gap-12 items-center group"
    >
      {/* Image */}
      <div className="relative bg-gradient-to-br from-[#3A3028] to-[#2A2420] border border-[#3A3631] overflow-hidden">
        {displayImg ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizeImage(displayImg, 1200)}
            alt={product.title}
            className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="aspect-[3/4] flex items-center justify-center text-[#3A3631] text-sm">Pas de photo</div>
        )}
        {/* Badge exemplaires restants */}
        {remaining !== null && remaining <= 5 && (
          <div className="absolute top-4 left-4 font-mono text-[11px] bg-[#B23A24] text-white px-3 py-1.5 uppercase tracking-wide">
            {remaining === 0 ? "Épuisé" : `${remaining} restant${remaining > 1 ? "s" : ""}`}
          </div>
        )}
      </div>
      {/* Infos */}
      <div>
        <div className="text-[11px] uppercase tracking-[0.18em] text-[#B23A24] font-semibold mb-5 flex items-center gap-2">
          <span className="w-4 h-px bg-[#B23A24]" />
          Drop — disponible en temps limité
        </div>
        <h3 className="font-serif text-[32px] md:text-[38px] leading-[1.05] mb-4 group-hover:text-[#E8D9D3] transition-colors">
          {product.title}
        </h3>
        {product.medium && (
          <p className="font-mono text-[11px] uppercase tracking-wide text-[#8C8780] mb-4">{product.medium}</p>
        )}
        {product.description && (
          <p className="text-[15px] text-[#C7C2B8] max-w-[460px] mb-6 leading-relaxed">
            {product.description}
          </p>
        )}
        {/* Compte à rebours */}
        {product.temporaryUntil && (
          <div className="mb-6 border-t border-[#3A3631] pt-5">
            <p className="text-[10px] uppercase tracking-widest text-[#8C8780] mb-3">Temps restant</p>
            <Countdown until={product.temporaryUntil} />
          </div>
        )}
        <div className="flex items-center gap-5 mt-4 flex-wrap">
          <span className="font-mono text-[22px]">dès {fmt(minPrice(product))}</span>
          <span className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold bg-[#FAFAF8] text-[#181614] group-hover:bg-[#B23A24] group-hover:text-white transition-colors">
            Voir le drop
          </span>
        </div>
        {remaining !== null && remaining > 0 && (
          <p className="text-[12px] text-[#8C8780] mt-4 font-mono">
            {remaining} exemplaire{remaining > 1 ? "s" : ""} disponible{remaining > 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Link>
  );
}
