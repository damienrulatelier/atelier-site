"use client";
import { useState } from "react";
import { useCart } from "./CartContext";
import type { Product, SizeKey } from "@/lib/products-types";
import { ALL_SIZES } from "@/lib/products-types";
function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}
export default function AddToCartModal({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const { addLine } = useCart();
  const d = product.delivery;
  const [checkedEmail, setCheckedEmail] = useState(false);
  const [checkedOriginal, setCheckedOriginal] = useState(false);
  const [checkedSizes, setCheckedSizes] = useState<Partial<Record<SizeKey, number>>>({});
  const [dedicationName, setDedicationName] = useState("");
  const [dedicationText, setDedicationText] = useState("");
  const [specialRequest, setSpecialRequest] = useState("");
  if (!d) return null;
  const availableSizes = ALL_SIZES.filter((s) =>
    d.print?.sizes[s]?.enabled ||
    d.printEmail?.sizes[s]?.enabled ||
    d.originalPrint?.sizes[s]?.enabled ||
    d.originalPrintEmail?.sizes[s]?.enabled
  );
  const availableCanvasSizes = ALL_SIZES.filter((s) => d.canvas?.sizes[s]?.enabled);
  function priceForCanvas(s: SizeKey): number { return d.canvas?.sizes[s]?.price || 0; }
  const [checkedCanvasSizes, setCheckedCanvasSizes] = useState<Partial<Record<SizeKey, number>>>({});
  function priceForSize(s: SizeKey): number {
    return (
      d.print?.sizes[s]?.enabled ? d.print.sizes[s].price :
      d.printEmail?.sizes[s]?.enabled ? d.printEmail.sizes[s].price :
      d.originalPrint?.sizes[s]?.enabled ? d.originalPrint.sizes[s].price :
      d.originalPrintEmail?.sizes[s]?.enabled ? d.originalPrintEmail.sizes[s].price : 0
    );
  }
  const originalPrice =
    d.original?.enabled ? d.original.price :
    d.originalEmail?.enabled ? d.originalEmail.price :
    d.originalPrint?.enabled ? (d.originalPrint.sizes?.A4?.price || 0) :
    d.originalPrintEmail?.enabled ? (d.originalPrintEmail.sizes?.A4?.price || 0) : 0;
  const originalAvailable = (d.original?.enabled || d.originalEmail?.enabled || d.originalPrint?.enabled || d.originalPrintEmail?.enabled);
  const hasEditionLimit = product.editionTotal > 0;
  const totalSold = product.editionSold || 0;
  const totalRemaining = hasEditionLimit ? Math.max(product.editionTotal - totalSold, 0) : Infinity;
  const totalSelectedPrints = Object.values(checkedSizes).reduce((sum: number, q) => sum + ((q as number) || 0), 0);
  const originalTotal = checkedOriginal ? originalPrice : 0;
  const hasPrint = Object.values(checkedSizes).some(q => ((q as number) || 0) > 0);
  const hasCanvas = Object.values(checkedCanvasSizes).some(q => ((q as number) || 0) > 0);
  const printDiscount = checkedOriginal && hasPrint ? 0.20 : 0;
  const sizesTotal = Object.entries(checkedSizes).reduce(
    (sum: number, [s, qty]) => sum + priceForSize(s as SizeKey) * ((qty as number) || 0) * (1 - printDiscount), 0
  );
  const canvasTotal = Object.entries(checkedCanvasSizes).reduce(
    (sum: number, [s, qty]) => sum + priceForCanvas(s as SizeKey) * ((qty as number) || 0), 0
  );
  const emailBasePrice = d.email?.price || 0;
  const emailDiscount = checkedEmail
    ? checkedOriginal ? emailBasePrice : hasPrint ? Math.min(3, emailBasePrice) : 0
    : 0;
  const emailTotal = checkedEmail ? Math.max(0, emailBasePrice - emailDiscount) : 0;
  const total = sizesTotal + canvasTotal + emailTotal + originalTotal;
  const nothingSelected = !checkedEmail && !checkedOriginal &&
    Object.values(checkedSizes).every(q => (q || 0) === 0) &&
    Object.values(checkedCanvasSizes).every(q => (q || 0) === 0);
  function confirm() {
    const dedication = product.allowDedication
      ? [dedicationName && `Pour ${dedicationName}`, dedicationText].filter(Boolean).join(" — ")
      : "";
    // Une ligne par exemplaire print
    Object.entries(checkedSizes).forEach(([s, qty]) => {
      if (((qty as number) || 0) > 0) {
        const price = priceForSize(s as SizeKey) * (1 - printDiscount);
        for (let i = 0; i < (qty as number); i++) {
          addLine({
            productId: product.id,
            title: product.title,
            price,
            medium: product.medium,
            size: `Print ${s}`,
            image: product.images[0] || "",
            isDedicated: product.allowDedication,
            dedication,
            specialRequest: specialRequest.trim() || undefined,
          });
        }
      }
    });
    // Une ligne par exemplaire toile
    Object.entries(checkedCanvasSizes).forEach(([s, qty]) => {
      if (((qty as number) || 0) > 0) {
        const price = priceForCanvas(s as SizeKey);
        for (let i = 0; i < (qty as number); i++) {
          addLine({
            productId: product.id,
            title: product.title,
            price,
            medium: product.medium,
            size: `Toile ${s}`,
            image: product.images[0] || "",
            isDedicated: product.allowDedication,
            dedication,
            specialRequest: specialRequest.trim() || undefined,
          });
        }
      }
    });
    // Fichier numérique
    if (checkedEmail) {
      addLine({
        productId: product.id,
        title: product.title,
        price: emailTotal,
        medium: product.medium,
        size: "Fichier numérique",
        image: product.images[0] || "",
        isDedicated: product.allowDedication,
        dedication,
        specialRequest: specialRequest.trim() || undefined,
      });
    }
    // Œuvre originale
    if (checkedOriginal) {
      addLine({
        productId: product.id,
        title: product.title,
        price: originalPrice,
        medium: product.medium,
        size: "Œuvre originale",
        image: product.images[0] || "",
        isDedicated: product.allowDedication,
        dedication,
        specialRequest: specialRequest.trim() || undefined,
      });
    }
    onClose();
  }
  const labelCls = "text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-3 block";
  const rowCls = "flex items-center justify-between gap-3 px-4 py-3 border cursor-pointer transition-colors";
  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#FAFAF8] w-full md:max-w-lg max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-serif text-xl text-[#181614]">{product.title}</h2>
            {product.medium && <p className="text-sm text-[#8C8780]">{product.medium}</p>}
          </div>
          <button onClick={onClose} className="text-2xl text-[#8C8780] hover:text-[#181614] ml-4">×</button>
        </div>
        {/* Fichier numérique */}
        {d.email?.enabled && (
          <div className="mb-4">
            <label className={labelCls}>Fichier numérique</label>
            <label className={`${rowCls} ${checkedEmail ? "border-[#B23A24] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={checkedEmail} onChange={e => setCheckedEmail(e.target.checked)} className="w-4 h-4 accent-[#B23A24]" />
                <div>
                  <div className="text-sm font-medium">Fichier numérique</div>
                  <div className="text-[11px] text-[#8C8780]">
                    envoyé par e-mail
                    {checkedOriginal && <span className="ml-1 text-[#3A7D44] font-semibold">— offert avec l&rsquo;original 🎁</span>}
                    {!checkedOriginal && hasPrint && <span className="ml-1 text-[#3A7D44] font-semibold">— −3€ avec un print</span>}
                  </div>
                </div>
              </div>
              <div className="text-right">
                {checkedEmail && emailDiscount > 0 && (
                  <div className="font-mono text-[11px] text-[#8C8780] line-through">{fmt(emailBasePrice)}</div>
                )}
                <span className="font-mono text-sm font-semibold text-[#3A7D44]">
                  {checkedEmail && emailDiscount >= emailBasePrice ? "Offert" : fmt(emailDiscount > 0 ? emailBasePrice - emailDiscount : emailBasePrice)}
                </span>
              </div>
            </label>
          </div>
        )}
        {/* Prints par format */}
        {availableSizes.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className={labelCls.replace("mb-3", "")}>Prints (tirages papier)</label>
              {hasEditionLimit && (
                <span className={`font-mono text-[11px] font-semibold ${totalRemaining <= 3 ? "text-[#B23A24]" : "text-[#8C8780]"}`}>
                  {totalRemaining === 0 ? "Épuisé" : `${totalRemaining} restant${totalRemaining > 1 ? "s" : ""} sur ${product.editionTotal}`}
                </span>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {availableSizes.map(s => {
                const qty = checkedSizes[s] || 0;
                const price = priceForSize(s);
                const checked = qty > 0;
                const soldOut = totalRemaining === 0 && !checked;
                const canAddMore = totalSelectedPrints < totalRemaining;
                return (
                  <div key={s} className={`${rowCls} ${checked ? "border-[#B23A24] bg-[#F2F0EA]" : soldOut ? "border-[#DEDAD1] opacity-40" : "border-[#DEDAD1]"}`}>
                    <label className={`flex items-center gap-3 flex-1 ${soldOut ? "cursor-not-allowed" : "cursor-pointer"}`}>
                      <input type="checkbox" checked={checked} disabled={soldOut}
                        onChange={e => setCheckedSizes(prev => ({ ...prev, [s]: e.target.checked ? 1 : 0 }))}
                        className="w-4 h-4 accent-[#B23A24]" />
                      <div>
                        <div className="text-sm font-medium">Format {s}</div>
                        <div className="text-[11px] text-[#8C8780]">
                          expédié par transporteur
                          {checkedOriginal && <span className="ml-1 text-[#3A7D44] font-semibold">— −20% avec l&rsquo;original</span>}
                        </div>
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      {checked && (
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setCheckedSizes(prev => ({ ...prev, [s]: Math.max(1, (prev[s] || 1) - 1) }))} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">−</button>
                          <span className="font-mono text-sm w-4 text-center">{qty}</span>
                          <button type="button" disabled={!canAddMore}
                            onClick={() => setCheckedSizes(prev => ({ ...prev, [s]: (prev[s] || 1) + 1 }))}
                            className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm disabled:opacity-40">+</button>
                        </div>
                      )}
                      <span className="font-mono text-sm font-semibold w-16 text-right">{fmt(price * Math.max(qty, 1))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Version toile */}
        {availableCanvasSizes.length > 0 && (
          <div className="mb-4">
            <label className={labelCls}>Version toile (montée sur châssis)</label>
            <div className="flex flex-col gap-2">
              {availableCanvasSizes.map(s => {
                const qty = checkedCanvasSizes[s] || 0;
                const price = priceForCanvas(s);
                const checked = qty > 0;
                return (
                  <div key={s} className={`${rowCls} ${checked ? "border-[#B23A24] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                    <label className="flex items-center gap-3 cursor-pointer flex-1">
                      <input type="checkbox" checked={checked}
                        onChange={e => setCheckedCanvasSizes(prev => ({ ...prev, [s]: e.target.checked ? 1 : 0 }))}
                        className="w-4 h-4 accent-[#B23A24]" />
                      <div>
                        <div className="text-sm font-medium">Toile {s}</div>
                        <div className="text-[11px] text-[#8C8780]">montée sur châssis, expédiée</div>
                      </div>
                    </label>
                    <div className="flex items-center gap-3">
                      {checked && (
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setCheckedCanvasSizes(prev => ({ ...prev, [s]: Math.max(1, (prev[s] || 1) - 1) }))} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">−</button>
                          <span className="font-mono text-sm w-4 text-center">{qty}</span>
                          <button type="button" onClick={() => setCheckedCanvasSizes(prev => ({ ...prev, [s]: (prev[s] || 1) + 1 }))} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">+</button>
                        </div>
                      )}
                      <span className="font-mono text-sm font-semibold w-16 text-right">{fmt(price * Math.max(qty, 1))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {/* Œuvre originale */}
        {originalAvailable && (
          <div className="mb-4">
            <label className={labelCls}>
              <span className="text-[#B23A24] font-bold">✦ Œuvre originale</span>
              <span className="ml-2 normal-case text-[#8C8780] font-normal">— pièce unique</span>
            </label>
            <label className={`${rowCls} ${checkedOriginal ? "border-[#B23A24] bg-[#FAF0EE]" : "border-[#B23A24]/30"}`}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={checkedOriginal} onChange={e => setCheckedOriginal(e.target.checked)} className="w-4 h-4 accent-[#B23A24]" />
                <div>
                  <div className="text-sm font-semibold text-[#B23A24]">Œuvre originale</div>
                  <div className="text-[11px] text-[#8C8780]">expédiée — une seule au monde{product.size ? ` · ${product.size}` : ""}</div>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-[#B23A24]">{fmt(originalPrice)}</span>
            </label>
          </div>
        )}
        {/* Dédicace */}
        {product.allowDedication && (
          <div className="mb-4 flex flex-col gap-2">
            <label className={labelCls}>Dédicace (gratuit — optionnel)</label>
            <p className="text-[11px] text-[#8C8780] -mt-2 mb-2">Laisse vide si tu n&rsquo;en veux pas.</p>
            <input type="text" placeholder="Prénom ou nom (optionnel)" value={dedicationName} onChange={e => setDedicationName(e.target.value)} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]" />
            <textarea placeholder="Message ou demande… (optionnel)" value={dedicationText} onChange={e => setDedicationText(e.target.value)} rows={2} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614] resize-none" />
          </div>
        )}
        {/* Demande particulière */}
        <div className="mb-4">
          <label className={labelCls}>Demande particulière (optionnel)</label>
          <textarea placeholder="Une précision, une demande spéciale… je ferai en fonction." value={specialRequest} onChange={e => setSpecialRequest(e.target.value)} rows={2} className="w-full border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614] resize-none" />
        </div>
        {/* Total et bouton */}
        <div className="pt-4 border-t border-[#DEDAD1]">
          {checkedOriginal && hasPrint && (
            <div className="flex justify-between text-sm text-[#3A7D44] mb-1 font-medium">
              <span>−20% sur les prints avec l&rsquo;original</span>
              <span className="font-mono">−{fmt(Object.entries(checkedSizes).reduce((sum: number, [s, qty]) => sum + priceForSize(s as SizeKey) * ((qty as number) || 0) * 0.20, 0))}</span>
            </div>
          )}
          {checkedEmail && emailDiscount > 0 && (
            <div className="flex justify-between text-sm text-[#3A7D44] mb-1 font-medium">
              <span>{checkedOriginal ? "Fichier numérique offert 🎁" : "Remise fichier numérique"}</span>
              <span className="font-mono">−{fmt(emailDiscount)}</span>
            </div>
          )}
          <div className="flex items-center justify-between gap-4 mt-2">
            <span className="font-mono text-xl font-bold">{fmt(total)}</span>
            <button onClick={confirm} disabled={nothingSelected} className="flex-1 bg-[#181614] text-white py-3.5 text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors disabled:opacity-40">
              Ajouter au panier
            </button>
          </div>
          {nothingSelected && <p className="text-[11px] text-[#8C8780] mt-2 text-center">Sélectionne au moins une option</p>}
        </div>
      </div>
    </div>
  );
}
