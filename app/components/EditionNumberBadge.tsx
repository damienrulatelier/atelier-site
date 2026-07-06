"use client";

// Sur Vercel, le système de réservation utilise des fichiers JSON locaux
// qui n'existent pas — on désactive ce composant complètement.
export default function EditionNumberBadge({
  editionTotal,
}: {
  productId: string;
  editionTotal: number;
}) {
  if (!editionTotal) return null;
  return null;
}
