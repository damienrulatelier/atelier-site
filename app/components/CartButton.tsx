"use client";

import { useCart } from "./CartContext";

export default function CartButton() {
  const { totalQty, openCart } = useCart();

  return (
    <button
      onClick={openCart}
      aria-haspopup="dialog"
      className="flex items-center gap-2 text-xs uppercase tracking-wide font-semibold border border-[#181614] px-4 py-2.5 hover:bg-[#181614] hover:text-[#FAFAF8] transition-colors"
    >
      Panier
      {totalQty > 0 && (
        <span className="font-mono bg-[#B23A24] text-white rounded-full w-[18px] h-[18px] flex items-center justify-center text-[11px]">
          {totalQty}
        </span>
      )}
    </button>
  );
}
