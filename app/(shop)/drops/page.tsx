"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}
function Countdown({ until }: { until: string }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    function update() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expiré"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h >= 24) {
        const d = Math.floor(h / 24);
        setTimeLeft(`${d}j ${h % 24}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
      } else {
        setTimeLeft(`${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
      }
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [until]);
  const diff = new Date(until).getTime() - Date.now();
  const urgent = diff < 3600000;
  return (
    <span className={`font-mono text-sm font-semibold ${urgent ? "text-[#B23A24]" : "text-[#3A3631]"}`}>
      ⏳ {timeLeft}
    </span>
  );
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
      for (const s of ["A6","A5","A4","A3","A2"] as const) {
        if (sizes[s]?.enabled) prices.push(sizes[s].price);
      }
    }
  }
  return prices.length ? Math.min(...prices.filter(v => v > 0)) : (p.price || 0);
}
export default function LimitesPage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        const limites = (data.products || []).filter((p: Product) =>
          p.active && (p.type === "drop" || (p.temporaryUntil && new Date(p.temporaryUntil).getTime() > Date.now()))
        ).sort((a: Product, b: Product) => {
          if (!a.temporaryUntil) return 1;
          if (!b.temporaryUntil) return -1;
          return new Date(a.temporaryUntil).getTime() - new Date(b.temporaryUntil).getTime();
        });
        setProducts(limites);
      });
  }, []);
  return (
    <main className="max-w-6xl mx-auto px-6 md:px-8 py-16">
      <div className="border-b border-[#DEDAD1] pb-6 mb-10">
        <h1 className="font-serif text-[34px] text-[#181614]">Drops</h1>
        <p className="text-sm text-[#8C8780] mt-1">
          Disponibles pour une durée limitée uniquement — une fois le compte à rebours écoulé, c&rsquo;est terminé.
        </p>
      </div>
      {!products ? (
        <p className="text-sm text-[#8C8780]">Chargement…</p>
      ) : products.length === 0 ? (
        <div className="py-16 text-center">
          <p className="font-serif text-[22px] text-[#181614] mb-3">Rien en ce moment.</p>
          <p className="text-sm text-[#8C8780]">
            Suis <a href="https://www.instagram.com/drdssin_" target="_blank" rel="noopener noreferrer" className="text-[#B23A24] hover:underline">@drdssin_</a> pour être averti des prochains drops.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 justify-items-center max-w-2xl mx-auto">
          {products.map(p => {
            const remaining = p.editionTotal > 0 ? Math.max(p.editionTotal - p.editionSold, 0) : null;
            const sold = p.editionSold || 0;
            return (
              <Link key={p.id} href={`/prints/${p.id}`} className="border border-[#DEDAD1] bg-[#FAFAF8] hover:border-[#181614] transition-colors p-4 group w-full">
                {/* Galerie photos — originales ET prints avec badge */}
                {(() => {
                  const allPhotos = [
                    ...(p.imagesOriginal || []).map(url => ({ url, label: "Originale" })),
                    ...p.images.map(url => ({ url, label: "Print" })),
                  ];
                  return allPhotos.length > 0 ? (
                    <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
                      {allPhotos.map((photo, i) => (
                        <div key={i} className="relative flex-shrink-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.url} alt={p.title} className="w-28 h-28 object-cover border border-[#DEDAD1] group-hover:scale-[1.02] transition-transform duration-300" />
                          <span className={`absolute bottom-0 left-0 right-0 text-[9px] font-semibold uppercase tracking-wide text-center py-0.5 ${photo.label === "Originale" ? "bg-[#B23A24] text-white" : "bg-[#181614] text-white"}`}>
                            {photo.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}
                <div className="flex flex-col gap-1.5">
                  <p className="font-serif text-[17px] text-[#181614] leading-tight">{p.title}</p>
                  {p.medium && <p className="text-[12px] text-[#8C8780]">{p.medium}</p>}
                  {p.temporaryUntil && <Countdown until={p.temporaryUntil} />}
                  <div className="flex flex-wrap gap-3 text-[12px]">
                    {sold >= 1 && (
                      <span className="text-[#3A7D44] font-medium">
                        {sold === 1 ? "1 exemplaire vendu" : `${sold} exemplaires vendus`}
                      </span>
                    )}
                    {remaining !== null && (
                      <span className={`font-medium ${remaining <= 3 ? "text-[#B23A24]" : "text-[#3A3631]"}`}>
                        {remaining === 0 ? "Épuisé" : `Il reste ${remaining} exemplaire${remaining > 1 ? "s" : ""}`}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-sm font-semibold text-[#181614]">
                    dès {fmt(minPrice(p))}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
