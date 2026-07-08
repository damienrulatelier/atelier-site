"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
import ImageLightbox from "../../../components/ImageLightbox";
import AddToCartModal from "../../../components/AddToCartModal";
import ProductReviews from "../../../components/ProductReviews";
import EditionNumberBadge from "../../../components/EditionNumberBadge";
function TemporaryCountdown({ until }: { until: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  useEffect(() => {
    function update() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expiré"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}j ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [until]);
  return (
    <div className="inline-flex items-center gap-2 bg-[#181614] text-white px-3 py-2 text-xs font-mono mb-4">
      ⏳ Disponible encore : <strong>{timeLeft}</strong>
    </div>
  );
}
function LastChanceBanner({ until }: { until: string }) {
  const [timeLeft, setTimeLeft] = useState<string>("");
  useEffect(() => {
    function update() {
      const diff = new Date(until).getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Retiré"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(d > 0 ? `${d}j ${h}h ${m}m` : `${h}h ${m}m ${s}s`);
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [until]);
  return (
    <div className="inline-flex items-center gap-2 bg-[#8C4A00] text-white px-3 py-2 text-xs font-mono mb-4">
      ⚠ Dernière chance — retiré du catalogue dans : <strong>{timeLeft}</strong>
    </div>
  );
}
export default function PrintDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [wallPreviewOpen, setWallPreviewOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [photoTab, setPhotoTab] = useState<"original" | "print">("original");
  const fromOriginals = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("from") === "originals";
  const [frameColor, setFrameColor] = useState("#181614");
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => {
        const list: Product[] = data.products || [];
        setAllProducts(list);
        const found = list.find((p) => p.id === id);
        setProduct(found || null);
      });
  }, [id]);
  useEffect(() => {
    if (!product?.images[0]) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const sampleSize = 40;
        canvas.width = sampleSize;
        canvas.height = sampleSize;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize);
        const data = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
        let r = 0, g = 0, b = 0;
        const count = sampleSize * sampleSize;
        for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; }
        r = Math.round(r / count * 0.55);
        g = Math.round(g / count * 0.55);
        b = Math.round(b / count * 0.55);
        setFrameColor(`rgb(${r}, ${g}, ${b})`);
      } catch { setFrameColor("#181614"); }
    };
    img.onerror = () => setFrameColor("#181614");
    img.src = product.images[0];
  }, [product?.images]);
  if (product === undefined) return <main className="py-24 text-center text-sm text-[#8C8780]">Chargement…</main>;
  if (product === null) return (
    <main className="max-w-xl mx-auto px-8 py-24 text-center">
      <p className="text-[#8C8780] mb-4">Cette œuvre n&rsquo;est plus disponible.</p>
      <Link href="/" className="text-[#B23A24] underline text-sm">Retourner à la boutique</Link>
    </main>
  );
  function similarityScore(p: Product): number {
    let score = 0;
    if (p.medium && product?.medium && p.medium.toLowerCase() === product.medium.toLowerCase()) score += 3;
    if (product?.type && p.type === product.type) score += 2;
    score += (p.editionSold || 0);
    return score;
  }
  const similar = allProducts.filter((p) => p.id !== product.id && p.active).sort((a, b) => similarityScore(b) - similarityScore(a)).slice(0, 3);
  function priceFrom(p: Product) {
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
  function fmtPrice(n: number) { return n.toFixed(2).replace(".", ",") + " €"; }
  return (
    <main>
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <button onClick={() => router.back()} className="text-sm text-[#8C8780] hover:text-[#181614] mb-6 inline-flex items-center gap-1.5">← Retour</button>
        <div className="grid md:grid-cols-2 gap-10 md:gap-14">
          {/* IMAGE */}
          <div>
            {(() => {
              const hasOriginalPhotos = (product.imagesOriginal || []).length > 0;
              const isDrop = product.type === "drop" || !!product.temporaryUntil;
              // Pour les drops : onglets original/print (on utilise images pour les prints si imagesPrint vide)
              const printPhotos = (product.imagesPrint || []).length > 0 ? product.imagesPrint! : product.images;
              const hasTabs = hasOriginalPhotos && printPhotos.length > 0 && (isDrop || (product.imagesPrint || []).length > 0);
              const activePhotos = hasTabs
                ? (photoTab === "original" ? product.imagesOriginal! : printPhotos)
                : fromOriginals && hasOriginalPhotos
                ? product.imagesOriginal!
                : product.images;
              return (
                <>
                  {hasTabs && (
                    <div className="flex gap-0 mb-3 border border-[#DEDAD1]">
                      <button type="button" onClick={() => { setPhotoTab("original"); setActiveImage(0); }}
                        className={`flex-1 py-2 text-xs uppercase tracking-wide font-semibold transition-colors ${photoTab === "original" ? "bg-[#B23A24] text-white" : "text-[#3A3631] hover:bg-[#F2F0EA]"}`}>
                        ✦ Œuvre originale
                      </button>
                      <button type="button" onClick={() => { setPhotoTab("print"); setActiveImage(0); }}
                        className={`flex-1 py-2 text-xs uppercase tracking-wide font-semibold transition-colors ${photoTab === "print" ? "bg-[#181614] text-white" : "text-[#3A3631] hover:bg-[#F2F0EA]"}`}>
                        Print
                      </button>
                    </div>
                  )}
                  <button onClick={() => activePhotos.length > 0 && setZoomOpen(true)} className="w-full bg-[#F2F0EA] border border-[#DEDAD1] relative overflow-hidden cursor-zoom-in block">
                    {((!hasTabs && product.type === "original") || (hasTabs && photoTab === "original")) && (
                      <span className="absolute top-4 left-4 font-mono text-[10px] px-2 py-0.5 z-10 border bg-[#B23A24] text-white border-[#B23A24]">ORIGINAL</span>
                    )}
                    {activePhotos[activeImage] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activePhotos[activeImage]} alt={product.title} className="w-full h-auto block" />
                    ) : (
                      <div className="w-full aspect-square flex items-center justify-center text-[#8C8780] text-sm">Pas de photo</div>
                    )}
                  </button>
                  {activePhotos.length > 1 && (
                    <div className="flex gap-2 mt-3">
                      {activePhotos.map((img, i) => (
                        <button key={img} onClick={() => setActiveImage(i)} className={`w-16 h-16 border overflow-hidden flex-shrink-0 ${i === activeImage ? "border-[#181614]" : "border-[#DEDAD1]"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              );
            })()}
            {product.wallPreviewEnabled && product.images.length > 0 && (
              <button onClick={() => setWallPreviewOpen(true)} className="mt-4 text-xs uppercase tracking-wide font-medium text-[#3A3631] border border-[#DEDAD1] px-4 py-2.5 hover:border-[#181614] transition-colors inline-flex items-center gap-2">
                <span>🖼️</span> Voir en situation sur un mur
              </button>
            )}
          </div>
          {/* INFOS */}
          <div>
            <h1 className="font-serif text-[32px] md:text-[38px] leading-tight text-[#181614] mb-2">{product.title}</h1>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[#8C8780] mb-6">
              {product.medium}
              {product.type === "original" && product.size ? ` · ${product.size}` : ""}
              {product.type === "print" && product.edition && !fromOriginals ? ` · ${product.edition}` : ""}
              {product.type !== "original" && !fromOriginals && product.editionTotal > 0
                ? ` · ${Math.max(product.editionTotal - product.editionSold, 0)}/${product.editionTotal} restants`
                : ""}
            </p>
            {product.type === "original" && (
              <p className="text-sm text-[#B23A24] font-medium italic mb-6">Pièce unique — reproductions et autres formats disponibles ci-dessous.</p>
            )}
            {product.description && (
              <p className="text-[15.5px] text-[#3A3631] leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>
            )}
            {product.type === "print" && product.editionTotal > 0 && !fromOriginals && (
              <div className="mb-4">
                <EditionNumberBadge productId={product.id} editionTotal={product.editionTotal} />
              </div>
            )}
            {product.temporaryUntil && new Date(product.temporaryUntil).getTime() > Date.now() && (
              <TemporaryCountdown until={product.temporaryUntil} />
            )}
            {product.retireAt && new Date(product.retireAt).getTime() > Date.now() && (
              <LastChanceBanner until={product.retireAt} />
            )}
            {(() => {
              const soldOut = product.editionTotal > 0 && product.editionSold >= product.editionTotal;
              return soldOut ? (
                <div className="w-full md:w-auto px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#3A3631] text-white text-center cursor-not-allowed opacity-70">Édition épuisée</div>
              ) : (
                <button onClick={() => setAddOpen(true)} className="w-full md:w-auto px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors">
                  Choisir un format et ajouter au panier
                </button>
              );
            })()}
            {product.allowDedication && (
              <p className="text-xs text-[#8C8780] mt-4">✎ Une dédicace personnalisée pourra être ajoutée au moment de la commande.</p>
            )}
            {product.linkedProductId && (() => {
              const linked = allProducts.find((p) => p.id === product.linkedProductId && p.type === "original");
              if (!linked) return null;
              const d = linked.delivery;
              const prices = d ? [d.original?.enabled ? d.original.price : null, d.originalEmail?.enabled ? d.originalEmail.price : null].filter((v): v is number => v !== null && v > 0) : [];
              const comboMin = prices.length ? Math.min(...prices) : 0;
              return (
                <div className="mt-6 p-4 border border-[#B23A24] bg-[#FAF8F5]">
                  <p className="text-xs uppercase tracking-wide font-semibold text-[#B23A24] mb-2">🎨 Œuvre originale disponible</p>
                  <Link href={`/originals/${linked.id}`} className="flex items-center gap-3 group">
                    {linked.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={linked.images[0]} alt={linked.title} className="w-12 h-12 object-cover border border-[#DEDAD1]" />
                    )}
                    <div>
                      <p className="text-sm font-medium group-hover:text-[#B23A24] transition-colors">{linked.title}</p>
                      <p className="text-xs text-[#8C8780]">Pièce unique — {comboMin > 0 ? `dès ${comboMin.toFixed(2).replace(".", ",")} €` : "nous contacter"}</p>
                    </div>
                  </Link>
                </div>
              );
            })()}
            <ProductReviews productTitle={product.title} />
          </div>
        </div>
      </div>
      {similar.length > 0 && (
        <section className="border-t border-[#DEDAD1] bg-[#F2F0EA] py-14">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <h2 className="font-serif text-[24px] text-[#181614] mb-7">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {similar.map((p) => (
                <Link key={p.id} href={`/prints/${p.id}`} className="bg-[#FAFAF8] border border-[#DEDAD1] flex flex-col group">
                  <div className="bg-[#F2F0EA] relative overflow-hidden">
                    {p.type === "original" && (
                      <span className="absolute top-3 left-3 font-mono text-[9px] px-1.5 py-0.5 z-10 border bg-[#B23A24] text-white border-[#B23A24]">ORIGINAL</span>
                    )}
                    {p.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.images[0]} alt={p.title} className="w-full h-auto block transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <div className="aspect-square w-full flex items-center justify-center text-[#8C8780] text-xs">Pas de photo</div>
                    )}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <h3 className="font-serif text-[15px] text-[#181614] group-hover:text-[#B23A24] transition-colors truncate">{p.title}</h3>
                    <span className="font-mono text-[13px] text-[#3A3631]">dès {fmtPrice(priceFrom(p))}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {zoomOpen && (
        <ImageLightbox images={product.images} title={product.title} onClose={() => setZoomOpen(false)} />
      )}
      {addOpen && <AddToCartModal product={product} onClose={() => setAddOpen(false)} />}
      {wallPreviewOpen && (
        <div className="fixed inset-0 z-[70] bg-[#181614]/70 flex items-center justify-center p-6" onClick={() => setWallPreviewOpen(false)}>
          <div className="max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden" style={{ background: "linear-gradient(165deg, #EDEAE2 0%, #E4E0D5 55%, #DCD7C9 100%)" }}>
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#181614]/10 to-transparent" />
              <div className="relative w-[46%] p-2 shadow-[0_10px_30px_rgba(24,22,20,0.35)]" style={{ backgroundColor: frameColor }}>
                <div className="w-full border-[3px]" style={{ borderColor: frameColor }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={product.images[0]} alt={product.title} className="w-full h-auto block" />
                </div>
              </div>
            </div>
            <div className="bg-[#FAFAF8] px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-xs text-[#8C8780]">Aperçu indicatif. Le cadre n&rsquo;est pas inclus à l&rsquo;achat — seul le tirage est vendu.</p>
              <button onClick={() => setWallPreviewOpen(false)} className="text-xs uppercase tracking-wide font-medium text-[#181614] hover:text-[#B23A24] flex-shrink-0">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
