"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CartButton from "./CartButton";

export default function SiteHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasActiveDrop, setHasActiveDrop] = useState(false);

  // Vérifie si un drop est actif en ce moment
  useEffect(() => {
    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        const now = Date.now();
        const active = (data.products || []).some((p: { temporaryUntil?: string; active?: boolean }) =>
          p.active && p.temporaryUntil && new Date(p.temporaryUntil).getTime() > now
        );
        setHasActiveDrop(active);
      })
      .catch(() => {});
  }, []);

  function handleCommissionsClick(e: React.MouseEvent) {
    // Si on est déjà sur /commissions, Next.js ne déclenche aucune navigation
    // au clic — on force donc nous-mêmes le retour en haut de la page.
    if (pathname === "/commissions") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMenuOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 bg-[#FAFAF8]/95 backdrop-blur-sm border-b border-[#DEDAD1]">
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-[84px] flex items-center justify-between">
        <Link href="/" className="font-serif italic text-xl text-[#181614]" onClick={() => setMenuOpen(false)}>
          Damien Rul <span className="text-[#B23A24] not-italic">·</span> Atelier
        </Link>

        {/* Navigation desktop */}
        <nav className="hidden md:flex gap-9 text-xs uppercase tracking-wide font-medium text-[#3A3631]">
          <Link href="/nouveautes" className="text-[#B23A24] font-bold hover:text-[#181614] transition-colors">
            ✦ Nouveautés
          </Link>
          <Link href="/#originals" className="hover:text-[#181614]">
            Originaux
          </Link>
          <Link href="/#prints" className="hover:text-[#181614]">
            Prints
          </Link>
          <Link href="/drops" className="relative hover:text-[#181614] flex items-center gap-1.5">
            Drops
            {hasActiveDrop && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B23A24] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B23A24]"></span>
              </span>
            )}
          </Link>
          <Link href="/#bd" className="hover:text-[#181614]">
            Bande dessinée
          </Link>
          <Link href="/commissions" onClick={handleCommissionsClick} className="hover:text-[#181614]">
            Commissions
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://www.instagram.com/drdssin_"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram @drdssin_"
            className="hidden md:flex items-center justify-center w-9 h-9 text-[#3A3631] hover:text-[#B23A24]"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </a>
          <Link
            href="/compte"
            aria-label="Mon compte"
            className="flex items-center justify-center w-9 h-9 text-[#3A3631] hover:text-[#181614]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M4.5 20c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5" strokeLinecap="round" />
            </svg>
          </Link>
          <CartButton />
          {/* Bouton menu mobile */}
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            aria-expanded={menuOpen}
            className="md:hidden flex flex-col gap-1.5 p-2 -mr-2"
          >
            <span
              className={`block w-5 h-px bg-[#181614] transition-transform ${
                menuOpen ? "translate-y-[3px] rotate-45" : ""
              }`}
            />
            <span
              className={`block w-5 h-px bg-[#181614] transition-transform ${
                menuOpen ? "-translate-y-[3px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* Navigation mobile dépliante */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[#DEDAD1] bg-[#FAFAF8] px-6 py-5 flex flex-col gap-4 text-xs uppercase tracking-wide font-medium text-[#3A3631]">
          <Link href="/nouveautes" onClick={() => setMenuOpen(false)} className="text-[#B23A24] font-bold">
            ✦ Nouveautés
          </Link>
          <Link href="/#originals" onClick={() => setMenuOpen(false)} className="hover:text-[#181614]">
            Originaux
          </Link>
          <Link href="/#prints" onClick={() => setMenuOpen(false)} className="hover:text-[#181614]">
            Prints
          </Link>
          <Link href="/drops" onClick={() => setMenuOpen(false)} className="relative hover:text-[#181614] flex items-center gap-1.5">
            Drops
            {hasActiveDrop && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B23A24] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#B23A24]"></span>
              </span>
            )}
          </Link>
          <Link href="/#bd" onClick={() => setMenuOpen(false)} className="hover:text-[#181614]">
            Bande dessinée
          </Link>
          <Link href="/commissions" onClick={handleCommissionsClick} className="hover:text-[#181614]">
            Commissions
          </Link>
        </nav>
      )}
    </header>
  );
}
