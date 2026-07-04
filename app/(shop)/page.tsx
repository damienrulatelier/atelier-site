"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
import ProductGrid from "../components/ProductGrid";
import BdFeature from "../components/BdFeature";
import ImageLightbox from "../components/ImageLightbox";
import FAQ from "../components/FAQ";

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

// Calcule le vrai prix le plus bas disponible pour un produit, à partir de
// ses tailles activées (papier et toile) — pas juste le prix de base brut,
// qui ne correspond plus forcément au tarif le plus accessible.
function minPrice(p: Product) {
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

export default function HomePage() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [zoomOpen, setZoomOpen] = useState(false);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products || []));
  }, []);

  // Une fois les produits chargés (et donc les sections #prints / #bd réellement
  // présentes dans la page), on défile manuellement vers l'ancre demandée.
  useEffect(() => {
    if (!products) return;
    const hash = window.location.hash;
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [products]);

  const now = Date.now();
  const drops = products?.filter((p) =>
    p.temporaryUntil && new Date(p.temporaryUntil).getTime() > now
  ) || [];
  // Un produit avec delivery.print activé apparaît dans Prints, peu importe son type
  const prints = products?.filter((p) =>
    !p.temporaryUntil &&
    p.delivery?.print?.enabled &&
    p.type !== "bd"
  ) || [];
  // Un produit de type original apparaît dans Originaux
  const originals = products?.filter((p) => p.type === "original") || [];
  const bdItems = products?.filter((p) => p.type === "bd") || [];
  const featured = products ? products.find((p) => p.featured) || products[0] : undefined;

  return (
    <main className="relative">
      {/* HERO — MOBILE : image encadrée façon vitrine, titre en dessous */}
      <section className="md:hidden border-b border-[#DEDAD1] bg-[#FAFAF8]">
        <div className="px-5 pt-6">
          <div className="text-center text-[11px] uppercase tracking-[0.14em] text-[#B23A24] font-semibold mb-4">
            Pièces uniques, tirages & BD
          </div>

          <Link
            href={featured ? (featured.type === "bd" ? "/#bd" : `/prints/${featured.id}`) : "#"}
            aria-label={featured ? `Voir la fiche de ${featured.title}` : "Œuvre vedette"}
            className="relative w-full bg-[#F2F0EA] border border-[#DEDAD1] overflow-hidden block"
          >
            {featured?.images[0] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.images[0]}
                alt={featured.title}
                className="w-full h-auto block"
              />
            ) : (
              <div className="w-full aspect-[3/4] bg-gradient-to-br from-[#ECE8DF] to-[#E2DDD2] flex items-center justify-center">
                <svg viewBox="0 0 300 320" className="w-1/2 h-1/2">
                  <circle cx="150" cy="120" r="86" fill="#B23A24" opacity="0.92" />
                  <path d="M0 220 Q150 160 300 215 L300 320 L0 320 Z" fill="#181614" />
                  <path d="M0 250 Q150 210 300 248 L300 320 L0 320 Z" fill="#3A3631" />
                </svg>
              </div>
            )}

            {featured && (
              <div className="absolute bottom-3 left-3 font-mono text-[10.5px] text-[#3A3631] bg-[#FAFAF8] border border-[#DEDAD1] px-2 py-1">
                {featured.title} · dès {fmt(minPrice(featured))}
              </div>
            )}

            {featured?.images[0] && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setZoomOpen(true);
                }}
                aria-label="Zoomer sur l'image"
                className="absolute top-3 right-3 w-9 h-9 bg-[#FAFAF8] border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] transition-colors z-10"
              >
                🔍
              </button>
            )}
          </Link>
        </div>

        <div className="px-6 py-8 text-center">
          <h1 className="font-serif text-[clamp(28px,8vw,38px)] leading-[1.1] text-[#181614]">
            Chaque pièce porte un peu{" "}
            <em className="text-[#B23A24] not-italic font-normal italic">de vous</em>.
          </h1>
          <p className="mt-4 text-[14.5px] text-[#3A3631]">
            Pièces originales, tirages et bande dessinée, numérotés, signés et dédicacés à la
            main, expédiés depuis l&rsquo;atelier. Du tirage de poche à la grande pièce murale, à
            vous de choisir.
          </p>
          <div className="mt-6 flex gap-3 flex-wrap justify-center">
            {drops.length > 0 && (
              <Link href="/drops" className="inline-flex items-center px-6 py-3 text-[13px] uppercase tracking-wide font-semibold bg-[#B23A24] text-white hover:bg-[#181614] transition-colors">
                Découvrir les drops
              </Link>
            )}
            <a href="#originals" className="inline-flex items-center px-6 py-3 text-[13px] uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors">
              Voir les originaux
            </a>
            <a href="#prints" className="inline-flex items-center px-6 py-3 text-[13px] uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors">
              Explorer les prints
            </a>
            {bdItems.length > 0 && (
              <a href="#bd" className="inline-flex items-center px-6 py-3 text-[13px] uppercase tracking-wide font-semibold border border-[#DEDAD1] text-[#181614] hover:border-[#181614] transition-colors">
                Découvrir la BD
              </a>
            )}
            <Link href="/nouveautes" className="inline-flex items-center px-6 py-3 text-[13px] uppercase tracking-wide font-semibold border border-[#DEDAD1] text-[#181614] hover:border-[#181614] transition-colors">
              Voir les nouveautés
            </Link>
            <Link href="/commissions" className="inline-flex items-center px-6 py-3 text-[13px] uppercase tracking-wide font-semibold border border-[#DEDAD1] text-[#181614] hover:border-[#181614] transition-colors">
              Une commission ?
            </Link>
          </div>
        </div>
      </section>

      {/* HERO — DESKTOP : deux colonnes côte à côte */}
      <section className="hidden md:block border-b border-[#DEDAD1] bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-8 py-24 grid grid-cols-[1.1fr_0.9fr] gap-16 items-center">
          <div>
            <div className="flex items-center gap-2.5 text-[12px] uppercase tracking-[0.14em] text-[#B23A24] font-semibold mb-4">
              <span className="w-[18px] h-px bg-[#B23A24]" />
              Pièces uniques, tirages & BD
            </div>
            <h1 className="font-serif text-[clamp(40px,6vw,68px)] leading-[1.02] text-[#181614]">
              Chaque pièce porte un peu{" "}
              <em className="text-[#B23A24] not-italic font-normal italic">de vous</em>.
            </h1>
            <p className="mt-6 max-w-md text-[17px] text-[#3A3631]">
              Pièces originales, tirages et bande dessinée, numérotés, signés et dédicacés à la
              main, expédiés depuis l&rsquo;atelier. Du tirage de poche à la grande pièce murale, à
              vous de choisir.
            </p>
            <div className="mt-9 flex gap-4 flex-wrap">
              {drops.length > 0 && (
                <Link href="/drops" className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold bg-[#B23A24] text-white hover:bg-[#181614] transition-colors">
                  Découvrir les drops
                </Link>
              )}
              <a href="#originals" className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors">
                Voir les originaux
              </a>
              <a href="#prints" className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors">
                Explorer les prints
              </a>
              {bdItems.length > 0 && (
                <a href="#bd" className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold border border-[#DEDAD1] text-[#181614] hover:border-[#181614] transition-colors">
                  Découvrir la BD
                </a>
              )}
              <Link href="/nouveautes" className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold border border-[#DEDAD1] text-[#181614] hover:border-[#181614] transition-colors">
                Voir les nouveautés
              </Link>
              <Link href="/commissions" className="inline-flex items-center px-7 py-3.5 text-[13px] uppercase tracking-wide font-semibold border border-[#DEDAD1] text-[#181614] hover:border-[#181614] transition-colors">
                Une commission ?
              </Link>
            </div>
          </div>

          {featured ? (
            <Link
              href={featured.type === "bd" ? "/#bd" : `/prints/${featured.id}`}
              className="relative bg-gradient-to-br from-[#ECE8DF] to-[#E2DDD2] border border-[#DEDAD1] overflow-hidden text-left cursor-pointer group block"
              aria-label={`Voir la fiche de ${featured.title}`}
            >
              {featured.images[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={featured.images[0]}
                  alt={featured.title}
                  className="w-full h-auto block transition-transform duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <svg viewBox="0 0 300 320" className="w-full aspect-[4/5]">
                  <circle cx="150" cy="120" r="86" fill="#B23A24" opacity="0.92" />
                  <path d="M0 220 Q150 160 300 215 L300 320 L0 320 Z" fill="#181614" />
                  <path d="M0 250 Q150 210 300 248 L300 320 L0 320 Z" fill="#3A3631" />
                </svg>
              )}
              <div className="absolute bottom-4 left-4 font-mono text-[11px] text-[#8C8780] bg-[#FAFAF8] border border-[#DEDAD1] px-2.5 py-1.5">
                {featured.title} · dès {fmt(minPrice(featured))}
              </div>
              {featured.images[0] && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setZoomOpen(true);
                  }}
                  aria-label="Zoomer sur l'image"
                  className="absolute top-4 right-4 w-10 h-10 bg-[#FAFAF8] border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] transition-colors opacity-0 group-hover:opacity-100"
                >
                  🔍
                </button>
              )}
            </Link>
          ) : (
            <div className="relative aspect-[4/5] bg-gradient-to-br from-[#ECE8DF] to-[#E2DDD2] border border-[#DEDAD1] flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 300 320" className="w-3/4 h-3/4">
                <circle cx="150" cy="120" r="86" fill="#B23A24" opacity="0.92" />
                <path d="M0 220 Q150 160 300 215 L300 320 L0 320 Z" fill="#181614" />
                <path d="M0 250 Q150 210 300 248 L300 320 L0 320 Z" fill="#3A3631" />
              </svg>
            </div>
          )}
        </div>
      </section>

      {/* À PROPOS */}
      <section className="border-b border-[#DEDAD1] bg-[#FAFAF8]">
        <div className="max-w-3xl mx-auto px-8 py-16 text-center">
          <div className="text-[12px] uppercase tracking-[0.14em] text-[#B23A24] font-semibold mb-4">
            L&rsquo;artiste
          </div>
          <p className="font-serif text-[22px] md:text-[26px] leading-[1.4] text-[#181614]">
            Je m&rsquo;appelle Damien Rul. Je navigue entre plusieurs univers — dessin
            d&rsquo;observation, illustration, peinture et surtout bande dessinée, toujours
            poussés dans le détail. Chaque image naît d&rsquo;une attention obsessionnelle à la
            perspective, au mouvement, à l&rsquo;anatomie et à l&rsquo;ambiance : tout ce qui lui
            donne vie et justesse. Chaque pièce qui part d&rsquo;ici est pensée et réalisée à la
            main, entre traditionnel et digital, avant de partir chez vous — en œuvre originale ou
            reproduite et numérotée, toujours signée et dédicacée sur demande.
          </p>
          <p className="font-mono text-[12.5px] text-[#8C8780] mt-6 max-w-xl mx-auto leading-relaxed">
            Sauf mention contraire, chaque pièce est une{" "}
            <span className="text-[#3A3631] font-medium">reproduction</span>{" "}
            imprimée de l&rsquo;œuvre, numérotée selon l&rsquo;édition. La mention{" "}
            <span className="text-[#B23A24] font-medium">original</span>{" "}
            signale, elle, la pièce que j&rsquo;ai réalisée de mes mains en un seul exemplaire — et
            même pour celles-ci, un tirage reproduit reste possible sur demande.
          </p>
        </div>
      </section>

      {/* Drops — en premier si disponibles */}
      {drops.length > 0 && (
        <section id="drops" className="py-22 border-b border-[#DEDAD1] bg-[#181614]">
          <div className="max-w-6xl mx-auto px-8">
            <div className="flex justify-between items-baseline mb-12 border-b border-[#B23A24] pb-6">
              <div>
                <h2 className="font-serif text-[34px] text-[#FAFAF8]">Drops</h2>
                <p className="text-sm text-[#8C8780] mt-1">Disponibles pour une durée limitée — le temps du compte à rebours</p>
              </div>
              <span className="font-mono text-sm text-[#B23A24]">
                {drops.length} pièce{drops.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ProductGrid products={drops} context="drops" />
          </div>
        </section>
      )}

      {/* Originaux — conditionnels */}
      {originals.length > 0 && (
        <section id="originals" className="py-22 border-b border-[#DEDAD1] bg-[#FAF8F5]">
          <div className="max-w-6xl mx-auto px-8">
            <div className="flex justify-between items-baseline mb-12 border-b border-[#B23A24] pb-6">
              <div>
                <h2 className="font-serif text-[34px] text-[#181614]">Œuvres Originales</h2>
                <p className="text-sm text-[#8C8780] mt-1">Pièces uniques, réalisées à la main — non reproductibles</p>
              </div>
              <span className="font-mono text-sm text-[#B23A24]">
                {originals.length} pièce{originals.length !== 1 ? "s" : ""} unique{originals.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ProductGrid products={originals} context="originals" />
          </div>
        </section>
      )}

      {/* Prints — conditionnels */}
      {prints.length > 0 && (
        <section id="prints" className="py-22 border-b border-[#DEDAD1] bg-[#FAFAF8]">
          <div className="max-w-6xl mx-auto px-8">
            <div className="flex justify-between items-baseline mb-12 border-b border-[#DEDAD1] pb-6">
              <h2 className="font-serif text-[34px] text-[#181614]">Prints</h2>
              <span className="font-mono text-sm text-[#8C8780]">
                {prints.length} pièce{prints.length !== 1 ? "s" : ""} disponible{prints.length !== 1 ? "s" : ""}
              </span>
            </div>
            <ProductGrid products={prints} context="prints" />
          </div>
        </section>
      )}

      {/* BD — conditionnels */}
      {bdItems.length > 0 && (
        <section id="bd" className="py-22">
          <div className="max-w-6xl mx-auto px-8">
            {bdItems.map((bd) => (
              <div key={bd.id}>
                <BdFeature product={bd as Product} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="faq" className="py-20 border-b border-[#DEDAD1] bg-[#FAFAF8]">
        <div className="max-w-6xl mx-auto px-6 md:px-8">
          <h2 className="font-serif text-[28px] text-[#181614] text-center mb-10">
            Questions fréquentes
          </h2>
          <FAQ />
        </div>
      </section>

      {zoomOpen && featured && (
        <ImageLightbox
          images={featured.images}
          title={featured.title}
          onClose={() => setZoomOpen(false)}
        />
      )}
    </main>
  );
}
