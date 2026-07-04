"use client";

import { useEffect } from "react";
import { useCart } from "./CartContext";

export default function ClearCartOnMount() {
  const { clear } = useCart();

  useEffect(() => {
    clear();

    // Certains navigateurs restaurent cette page depuis leur cache (bfcache)
    // quand on clique sur "Retour" — dans ce cas le composant ne se remonte
    // pas et le panier resterait avec son ancien contenu. L'événement
    // "pageshow" avec persisted=true détecte précisément ce cas, et on vide
    // le panier une seconde fois pour être sûr.
    function handlePageShow(e: PageTransitionEvent) {
      if (e.persisted) clear();
    }
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
