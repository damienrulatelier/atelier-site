"use client";
import { useState } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
import AddToCartModal from "../../../components/AddToCartModal";
import ImageLightbox from "../../../components/ImageLightbox";
import { optimizeImage } from "@/lib/cloudinary";
import ProductReviews from "../../../components/ProductReviews";

export default function Client({ product, similar }: { product: Product | null; similar: Product[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [tab, setTab] = useState<"original" | "print">("original");
  const [activeImg, setActiveImg] = useState(0);

  if (!product) return (
    <main className="max-w-xl mx-auto px-8 py-24 text-center">
      <p className="text-[#8C8780] mb-4">Cette œuvre n&rsquo;est plus disponible.</p>
      <Link href="/atelier" className="text-[#B23A24] underline text-sm">Retourner à l&rsquo;atelier</Link>
    </main>
  );

  const hasOrig = (product.imagesOriginal || []).length > 0;
  const isDrop = product.type === "drop" || !!product.temporaryUntil;
  const printPh = (product.imagesPrint || []).length > 0 ? product.imagesPrint! : product.images;
  const hasTabs = hasOrig && printPh.length > 0 && (isDrop || (product.imagesPrint || []).length > 0);
  const photos = hasTabs 
    ? (tab === "original" ? product.imagesOriginal! : printPh) 
    : fromOrig && hasOrig 
    ? product.imagesOriginal! 
    : product.images;
  const soldOut = product.editionTotal > 0 && product.editionSold >= product.editionTotal;

  function priceFrom(p: Product) {
    if (!p.delivery) return p.price || 0;
    const prices: number[] = [];
    const d = p.delivery;
    if (d.email?.enabled) prices.push(d.email.price);
    if (d.original?.enabled) prices.push(d.original.price);
    for (const k of ["print", "canvas", "printEmail", "originalPrint", "originalPrintEmail"] as const)
      if (d[k]?.enabled) for (const s of ["A6", "A5", "A4", "A3", "A2"] as const)
        if (d[k].sizes[s]?.enabled) prices.push(d[k].sizes[s].price);
    return prices.length ? Math.min(...prices.filter(v => v > 0)) : (p.price || 0);
  }

  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <Link href="/atelier" className="text-sm text-[#8C8780] hover:text-[#181614] mb-6 inline-flex items-center gap-1.5">← Retour</Link>
        <div className="grid md:grid-cols-2 gap-10 md:gap-14">
          <div>
            {hasTabs && (
              <div className="flex mb-3 border border-[#DEDAD1]">
                <a href="#" onClick={(e) => { e.preventDefault(); setTab("original"); setActiveImg(0); }} className={`flex-1 py-2 text-xs uppercase tracking-wide font-semibold text-center block ${tab === "original" ? "bg-[#B23A24] text-white" : "text-[#3A3631]"}`}>✦ Œuvre originale</a>
                <a href="#" onClick={(e) => { e.preventDefault(); setTab("print"); setActiveImg(0); }} className={`flex-1 py-2 text-xs uppercase tracking-wide font-semibold text-center block ${tab === "print" ? "bg-[#181614] text-white" : "text-[#3A3631]"}`}>Print</a>
              </div>
            )}
            <div onClick={() => photos.length > 0 && setZoomOpen(true)} className="w-full bg-[#F2F0EA] border border-[#DEDAD1] overflow-hidden cursor-pointer">
              {photos[activeImg]
                ? <img src={optimizeImage(photos[activeImg], 1200)} alt={product.title} className="w-full h-auto block" />
                : <div className="aspect-square flex items-center justify-center text-[#8C8780] text-sm">Pas de photo</div>}
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 mt-3">
                {photos.map((img, i) => (
                  <div key={img} onClick={() => setActiveImg(i)} className={`w-16 h-16 border overflow-hidden flex-shrink-0 cursor-pointer ${i === activeImg ? "border-[#181614]" : "border-[#DEDAD1]"}`}>
                    <img src={optimizeImage(img, 200)} alt="" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h1 className="font-serif text-[32px] md:text-[38px] leading-tight text-[#181614] mb-2">{product.title}</h1>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[#8C8780] mb-6">{product.medium}</p>
            {product.description && <p className="text-[15.5px] text-[#3A3631] leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>}
            {soldOut
              ? <div className="w-full px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#3A3631] text-white text-center opacity-70">Édition épuisée</div>
              : <a href="#" onClick={(e) => { e.preventDefault(); setAddOpen(true); }} className="w-full px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors block text-center">Choisir un format et ajouter au panier</a>
            }
            {product.allowDedication && <p className="text-xs text-[#8C8780] mt-4">✎ Une dédicace personnalisée pourra être ajoutée au moment de la commande.</p>}
            <ProductReviews productTitle={product.title} />
          </div>
        </div>
      </div>
      {similar.length > 0 && (
        <section className="border-t border-[#DEDAD1] bg-[#F2F0EA] py-14">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <h2 className="font-serif text-[24px] text-[#181614] mb-7">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {similar.map(p => (
                <Link key={p.id} href={`/prints/${p.id}`} className="bg-[#FAFAF8] border border-[#DEDAD1] flex flex-col group">
                  <div className="bg-[#F2F0EA] overflow-hidden aspect-square">
                    {p.images[0] ? <img src={optimizeImage(p.images[0], 600)} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /> : <div className="w-full h-full flex items-center justify-center text-[#8C8780] text-xs">Pas de photo</div>}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <h3 className="font-serif text-[15px] text-[#181614] group-hover:text-[#B23A24] transition-colors truncate">{p.title}</h3>
                    <span className="font-mono text-[13px] text-[#3A3631]">dès {priceFrom(p).toFixed(2).replace(".", ",")} €</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {zoomOpen && <ImageLightbox images={photos} title={product.title} onClose={() => setZoomOpen(false)} />}
      {addOpen && <AddToCartModal product={product} onClose={() => setAddOpen(false)} />}
    </main>
  );
}
