"use client";

import { useCart } from "./CartContext";
import Link from "next/link";

function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

export default function CartDrawer() {
  const { lines, isOpen, closeCart, updateQty, removeLine, subtotal } = useCart();

  return (
    <>
      <div
        onClick={closeCart}
        className={`fixed inset-0 bg-[#181614]/40 z-40 transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        role="dialog"
        aria-label="Panier"
        aria-hidden={!isOpen}
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#FAFAF8] z-50 flex flex-col shadow-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-7 py-6 border-b border-[#DEDAD1]">
          <h2 className="font-serif text-xl text-[#181614]">Mon panier</h2>
          <button
            onClick={closeCart}
            aria-label="Fermer le panier"
            className="text-2xl text-[#8C8780] hover:text-[#181614] leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-7">
          {lines.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 text-[#8C8780] py-16">
              <div className="text-3xl">○</div>
              <p>Ton panier est vide pour l&rsquo;instant.</p>
              <p className="font-mono text-xs">Choisis un print ou ta BD dédicacée</p>
            </div>
          ) : (
            lines.map((l) => (
              <div key={l.lineId} className="flex gap-4 py-5 border-b border-[#DEDAD1]">
                <div className="w-16 h-16 flex-shrink-0 bg-[#F2F0EA] border border-[#DEDAD1] overflow-hidden">
                  {l.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={l.image} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#181614]">{l.title}</p>
                  <p className="font-mono text-xs text-[#8C8780] uppercase tracking-wide">
                    {l.medium}
                    {l.size ? ` · ${l.size}` : ""}
                  </p>
                  {l.isDedicated && (
                    <div className="mt-2 text-xs italic text-[#3A3631] bg-[#E8D9D3] border-l-2 border-[#B23A24] px-2.5 py-1.5">
                      ✎ {l.dedication}
                    </div>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-2.5 font-mono text-sm">
                      <button
                        onClick={() => updateQty(l.lineId, -1)}
                        aria-label="Diminuer la quantité"
                        className="w-5.5 h-5.5 w-6 h-6 border border-[#DEDAD1] hover:border-[#181614] flex items-center justify-center"
                      >
                        −
                      </button>
                      <span>{l.qty}</span>
                      <button
                        onClick={() => updateQty(l.lineId, 1)}
                        aria-label="Augmenter la quantité"
                        className="w-6 h-6 border border-[#DEDAD1] hover:border-[#181614] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                    <span className="font-mono text-sm">{fmt(l.price * l.qty)}</span>
                  </div>
                  <button
                    onClick={() => removeLine(l.lineId)}
                    className="mt-2 text-xs text-[#8C8780] hover:text-[#B23A24] underline"
                  >
                    Retirer
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {lines.length > 0 && (
          <div className="px-7 py-6 border-t border-[#DEDAD1]">
            <div className="flex justify-between text-sm mb-1">
              <span>Sous-total</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            <p className="font-mono text-xs text-[#8C8780] mb-4">
              Livraison calculée à l&rsquo;étape suivante
            </p>
            <Link
              href="/commande"
              onClick={closeCart}
              className="block w-full text-center bg-[#181614] text-white py-4 text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors"
            >
              Passer la commande
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
