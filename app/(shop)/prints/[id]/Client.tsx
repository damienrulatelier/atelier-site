"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import type { Product } from "@/lib/products-types";
import AddToCartModal from "../../../components/AddToCartModal";
import ImageLightbox from "../../../components/ImageLightbox";
import { optimizeImage } from "@/lib/cloudinary";
import EditionNumberBadge from "../../../components/EditionNumberBadge";
import ProductReviews from "../../../components/ProductReviews";

function Countdown({ until }: { until: string }) {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => {
      const d = new Date(until).getTime() - Date.now();
      if (d <= 0) { setT("Expiré"); return; }
      const h = Math.floor(d/3600000), m = Math.floor((d%3600000)/60000), s = Math.floor((d%60000)/1000);
      setT(h>=24?`${Math.floor(h/24)}j ${h%24}h ${m}m`:`${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [until]);
  return <div className="inline-flex items-center gap-2 bg-[#181614] text-white px-3 py-2 text-xs font-mono mb-4">⏳ {t}</div>;
}

const btnStyle = { WebkitTapHighlightColor: "transparent", touchAction: "manipulation" as const, userSelect: "none" as const };

export default function Client({ product, similar }: { product: Product | null; similar: Product[] }) {
  const [addOpen, setAddOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [wallOpen, setWallOpen] = useState(false);
  const [tab, setTab] = useState<"original"|"print">("original");
  const [activeImg, setActiveImg] = useState(0);
  const [frame, setFrame] = useState("#181614");
  const [fromOrig, setFromOrig] = useState(false);

  useEffect(() => {
    setFromOrig(new URLSearchParams(window.location.search).get("from") === "originals");
  }, []);

  useEffect(() => {
    const src = product?.images[0];
    if (!src) return;
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const c = document.createElement("canvas"); c.width = c.height = 40;
        const x = c.getContext("2d")!;
        x.drawImage(img, 0, 0, 40, 40);
        const d = x.getImageData(0,0,40,40).data;
        let r=0,g=0,b=0;
        for (let i=0;i<d.length;i+=4){r+=d[i];g+=d[i+1];b+=d[i+2];}
        const n = 1600;
        setFrame(`rgb(${Math.round(r/n*.55)},${Math.round(g/n*.55)},${Math.round(b/n*.55)})`);
      } catch { setFrame("#181614"); }
    };
    img.src = src;
  }, [product?.images]);

  if (!product) return (
    <main className="max-w-xl mx-auto px-8 py-24 text-center">
      <p className="text-[#8C8780] mb-4">Cette œuvre n&rsquo;est plus disponible.</p>
      <Link href="/atelier" className="text-[#B23A24] underline text-sm">Retourner à l&rsquo;atelier</Link>
    </main>
  );

  const hasOrig = (product.imagesOriginal||[]).length > 0;
  const isDrop = product.type === "drop" || !!product.temporaryUntil;
  const printPh = (product.imagesPrint||[]).length > 0 ? product.imagesPrint! : product.images;
  const hasTabs = hasOrig && printPh.length > 0 && (isDrop || (product.imagesPrint||[]).length > 0);
  // fromOrig toujours false au premier rendu pour éviter mismatch hydratation
  const photos = hasTabs ? (tab==="original" ? product.imagesOriginal! : printPh) : product.images;
  const soldOut = product.editionTotal > 0 && product.editionSold >= product.editionTotal;

  function priceFrom(p: Product) {
    if (!p.delivery) return p.price||0;
    const prices: number[] = [];
    const d = p.delivery;
    if (d.email?.enabled) prices.push(d.email.price);
    if (d.original?.enabled) prices.push(d.original.price);
    for (const k of ["print","canvas","printEmail","originalPrint","originalPrintEmail"] as const)
      if (d[k]?.enabled) for (const s of ["A6","A5","A4","A3","A2"] as const) if (d[k].sizes[s]?.enabled) prices.push(d[k].sizes[s].price);
    return prices.length ? Math.min(...prices.filter(v=>v>0)) : (p.price||0);
  }



  return (
    <main suppressHydrationWarning>
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-8">
        <Link href="/atelier" style={btnStyle} className="text-sm text-[#8C8780] hover:text-[#181614] mb-6 inline-flex items-center gap-1.5">← Retour</Link>
        <div className="grid md:grid-cols-2 gap-10 md:gap-14">
          <div>
            {hasTabs && (
              <div className="flex mb-3 border border-[#DEDAD1]">
                <button type="button" style={btnStyle} onClick={()=>{setTab("original");setActiveImg(0);}} className={`flex-1 py-2 text-xs uppercase tracking-wide font-semibold transition-colors ${tab==="original"?"bg-[#B23A24] text-white":"text-[#3A3631] hover:bg-[#F2F0EA]"}`}>✦ Œuvre originale</button>
                <button type="button" style={btnStyle} onClick={()=>{setTab("print");setActiveImg(0);}} className={`flex-1 py-2 text-xs uppercase tracking-wide font-semibold transition-colors ${tab==="print"?"bg-[#181614] text-white":"text-[#3A3631] hover:bg-[#F2F0EA]"}`}>Print</button>
              </div>
            )}
            <button style={btnStyle} onClick={()=>photos.length>0&&setZoomOpen(true)} className="w-full bg-[#F2F0EA] border border-[#DEDAD1] overflow-hidden cursor-zoom-in block">
              {photos[activeImg]
                ? <img src={optimizeImage(photos[activeImg],1200)} alt={product.title} className="w-full h-auto block"/>
                : <div className="aspect-square flex items-center justify-center text-[#8C8780] text-sm">Pas de photo</div>}
            </button>
            {photos.length > 1 && (
              <div className="flex gap-2 mt-3">
                {photos.map((img,i) => (
                  <button key={img} style={btnStyle} onClick={()=>setActiveImg(i)} className={`w-16 h-16 border overflow-hidden flex-shrink-0 ${i===activeImg?"border-[#181614]":"border-[#DEDAD1]"}`}>
                    <img src={optimizeImage(img,200)} alt="" className="w-full h-full object-cover"/>
                  </button>
                ))}
              </div>
            )}
            {product.wallPreviewEnabled && product.images.length > 0 && (
              <button style={btnStyle} onClick={()=>setWallOpen(true)} className="mt-4 text-xs uppercase tracking-wide font-medium text-[#3A3631] border border-[#DEDAD1] px-4 py-2.5 hover:border-[#181614] transition-colors inline-flex items-center gap-2">
                🖼️ Voir en situation sur un mur
              </button>
            )}
          </div>
          <div>
            <h1 className="font-serif text-[32px] md:text-[38px] leading-tight text-[#181614] mb-2">{product.title}</h1>
            <p className="font-mono text-[12px] uppercase tracking-wide text-[#8C8780] mb-6">
              {product.medium}
              {product.type==="original"&&product.size?` · ${product.size}`:""}
              {product.type==="print"&&product.edition&&!fromOrig?` · ${product.edition}`:""}
              {product.type!=="original"&&!fromOrig&&product.editionTotal>0?` · ${Math.max(product.editionTotal-product.editionSold,0)}/${product.editionTotal} restants`:""}
            </p>
            {product.type==="original"&&<p className="text-sm text-[#B23A24] font-medium italic mb-6">Pièce unique — reproductions et autres formats disponibles ci-dessous.</p>}
            {product.description&&<p className="text-[15.5px] text-[#3A3631] leading-relaxed mb-8 whitespace-pre-line">{product.description}</p>}
            {product.type==="print"&&product.editionTotal>0&&!fromOrig&&<div className="mb-4"><EditionNumberBadge productId={product.id} editionTotal={product.editionTotal}/></div>}
            {product.temporaryUntil&&new Date(product.temporaryUntil).getTime()>Date.now()&&<Countdown until={product.temporaryUntil}/>}
            {soldOut
              ? <div className="w-full md:w-auto px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#3A3631] text-white text-center cursor-not-allowed opacity-70">Édition épuisée</div>
              : <button style={btnStyle} onClick={()=>setAddOpen(true)} className="w-full md:w-auto px-8 py-4 text-sm uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors">Choisir un format et ajouter au panier</button>
            }
            {product.allowDedication&&<p className="text-xs text-[#8C8780] mt-4">✎ Une dédicace personnalisée pourra être ajoutée au moment de la commande.</p>}
            <ProductReviews productTitle={product.title}/>
          </div>
        </div>
      </div>
      {similar.length>0&&(
        <section className="border-t border-[#DEDAD1] bg-[#F2F0EA] py-14">
          <div className="max-w-6xl mx-auto px-6 md:px-8">
            <h2 className="font-serif text-[24px] text-[#181614] mb-7">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
              {similar.map(p=>(
                <Link key={p.id} href={`/prints/${p.id}`} className="bg-[#FAFAF8] border border-[#DEDAD1] flex flex-col group">
                  <div className="bg-[#F2F0EA] overflow-hidden">
                    {p.images[0]?<img src={optimizeImage(p.images[0],600)} alt={p.title} className="w-full h-auto block transition-transform duration-500 group-hover:scale-105"/>:<div className="aspect-square flex items-center justify-center text-[#8C8780] text-xs">Pas de photo</div>}
                  </div>
                  <div className="p-4 flex flex-col gap-1">
                    <h3 className="font-serif text-[15px] text-[#181614] group-hover:text-[#B23A24] transition-colors truncate">{p.title}</h3>
                    <span className="font-mono text-[13px] text-[#3A3631]">dès {priceFrom(p).toFixed(2).replace(".",",")} €</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
      {zoomOpen&&<ImageLightbox images={photos} title={product.title} onClose={()=>setZoomOpen(false)}/>}
      {addOpen&&<AddToCartModal product={product} onClose={()=>setAddOpen(false)}/>}
      {wallOpen&&(
        <div className="fixed inset-0 z-[70] bg-[#181614]/70 flex items-center justify-center p-6" onClick={()=>setWallOpen(false)}>
          <div className="max-w-lg w-full" onClick={e=>e.stopPropagation()}>
            <div className="relative aspect-[4/3] flex items-center justify-center overflow-hidden" style={{background:"linear-gradient(165deg,#EDEAE2 0%,#E4E0D5 55%,#DCD7C9 100%)"}}>
              <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#181614]/10 to-transparent"/>
              <div className="relative w-[46%] p-2" style={{backgroundColor:frame}}>
                <div className="w-full border-[3px]" style={{borderColor:frame}}>
                  <img src={optimizeImage(hasTabs&&tab==="original"&&product.imagesOriginal?.[0]?product.imagesOriginal[0]:product.images[0],800)} alt={product.title} className="w-full h-auto block"/>
                </div>
              </div>
            </div>
            <div className="bg-[#FAFAF8] px-5 py-4 flex items-center justify-between gap-4">
              <p className="text-xs text-[#8C8780]">Aperçu indicatif. Le cadre n&rsquo;est pas inclus.</p>
              <button style={btnStyle} onClick={()=>setWallOpen(false)} className="text-xs uppercase tracking-wide font-medium text-[#181614] hover:text-[#B23A24]">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
