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
  reservedNumber?: number;
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
function safeGet(): CartLine[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
}
function safeSet(lines: CartLine[]) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(lines)); } catch { /* ignore */ }
}
export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    setLines(safeGet());
  }, []);
  useEffect(() => {
    safeSet(lines);
  }, [lines]);
  function addLine(input: Omit<CartLine, "lineId" | "qty">) {
    setLines(prev => [...prev, { ...input, lineId: "l_" + Date.now().toString(36) + Math.random().toString(36).slice(2,6), qty: 1 }]);
    setIsOpen(true);
  }
  function updateQty(lineId: string, delta: number) {
    setLines(prev => prev.map(l => l.lineId === lineId ? { ...l, qty: l.qty + delta } : l).filter(l => l.qty > 0));
  }
  function removeLine(lineId: string) {
    setLines(prev => prev.filter(l => l.lineId !== lineId));
  }
  function clear() {
    setLines([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
  }
  const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  return (
    <CartContext.Provider value={{ lines, isOpen, openCart: () => setIsOpen(true), closeCart: () => setIsOpen(false), addLine, updateQty, removeLine, clear, subtotal, totalQty }}>
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
