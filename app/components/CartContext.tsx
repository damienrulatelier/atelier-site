"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type CartLine = {
  lineId: string;
  productId: string;
  title: string;
  price: number;
  medium: string;
  size: string;
  image: string;
  isDedicated: boolean;
  qty: number;
  dedication: string;
  specialRequest?: string;
  reservedNumber?: number; // numéro d'édition réservé pour cette ligne, si applicable
};

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addLine: (line: Omit<CartLine, "lineId" | "qty">) => void;
  updateQty: (lineId: string, delta: number) => void;
  removeLine: (lineId: string) => void;
  clear: () => void;
  subtotal: number;
  totalQty: number;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "atelier_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Charge le panier depuis sessionStorage au montage (uniquement côté client)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) setLines(JSON.parse(raw));
    } catch {
      // sessionStorage indisponible : on continue avec un panier vide
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // ignore si stockage indisponible
    }
  }, [lines, hydrated]);

  function addLine(input: Omit<CartLine, "lineId" | "qty">) {
    setLines((prev) => {
      // Les produits sans dédicace se regroupent par quantité ;
      // chaque dédicace reste une ligne distincte (texte différent à chaque fois).
      if (!input.isDedicated) {
        const existing = prev.find((l) => l.productId === input.productId && !l.isDedicated);
        if (existing) {
          return prev.map((l) =>
            l.lineId === existing.lineId ? { ...l, qty: l.qty + 1 } : l
          );
        }
      }
      const newLine: CartLine = {
        ...input,
        lineId: "l_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        qty: 1,
      };
      return [...prev, newLine];
    });
    setIsOpen(true);
  }

  function updateQty(lineId: string, delta: number) {
    setLines((prev) =>
      prev
        .map((l) => (l.lineId === lineId ? { ...l, qty: l.qty + delta } : l))
        .filter((l) => l.qty > 0)
    );
  }

  function removeLine(lineId: string) {
    setLines((prev) => prev.filter((l) => l.lineId !== lineId));
  }

  function clear() {
    setLines([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore si sessionStorage indisponible
    }
  }

  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);

  return (
    <CartContext.Provider
      value={{
        lines,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addLine,
        updateQty,
        removeLine,
        clear,
        subtotal,
        totalQty,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé à l'intérieur d'un CartProvider.");
  return ctx;
}
