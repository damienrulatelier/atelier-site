// Les prix sont désormais fixés à la main par produit dans l'admin (pricesBySize).
// Ce fichier ne contient plus que les libellés et dimensions de référence des formats.
export const SIZE_OPTIONS = [
  { key: "A6", label: "A6", sub: "10,5 × 14,8 cm · 180g" },
  { key: "A5", label: "A5", sub: "14,8 × 21 cm · 180g" },
  { key: "A4", label: "A4", sub: "21 × 29,7 cm · 200g" },
  { key: "A3", label: "A3", sub: "29,7 × 42 cm · 200g" },
  { key: "A2", label: "A2", sub: "42 × 59,4 cm · 250g" },
] as const;

export type SizeKey = (typeof SIZE_OPTIONS)[number]["key"];
