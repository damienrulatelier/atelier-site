"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import CartButton from "./CartButton";
export default function SiteHeader({ hasActiveDrop = false }: { hasActiveDrop?: boolean }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [atelierOpen, setAtelierOpen] = useState(false);
  const atelierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: Event) {
      if (atelierRef.current && !atelierRef.current.contains(e.target as Node)) {
        setAtelierOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
    };
  }, []);
  function handleCommissionsClick(e: React.MouseEvent) {
    if (pathname === "/commissions") {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    setMenuOpen(false);
    setAtelierOpen(false);
  }
  const isInAtelier = pathname?.startsWith("/atelier") || pathname === "/nouveautes" ||
    pathname?.startsWith("/prints") || pathname?.startsWith("/originals");
  return (
    <header className="relative z-30 bg-[#FAFAF8] border-b border-[#DEDAD1]">
      <div className="max-w-6xl mx-auto px-6 md:px-8 h-[84px] flex items-center justify-between">
        <Link href="/" className="font-serif italic text-xl text-[#181614]" onClick={() => { setMenuOpen(false); setAtelierOpen(false); }}>
          Damien Rul <span className="text-[#B23A24] not-italic">·</span> Atelier
        </Link>
        <nav className="hidden md:flex gap-9 text-xs uppercase tracking-wide font-medium text-[#3A3631] items-center">
          <div ref={atelierRef} className="relative">
            <button onClick={() => setAtelierOpen(v => !v)} className={`flex items-center gap-1 hover:text-[#181614] transition-colors normal-case ${isInAtelier ? "text-[#181614] font-bold" : ""}`}>
              Atelier
              <span className={`text-[8px] transition-transform duration-200 ${atelierOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {atelierOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-[#FAFAF8] border border-[#DEDAD1] shadow-lg min-w-[160px] py-2">
                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#FAFAF8] border-t border-l border-[#DEDAD1] rotate-45" />
                <Link href="/nouveautes" onClick={() => setAtelierOpen(false)} className="block px-5 py-2.5 text-xs uppercase tracking-wide hover:bg-[#F2F0EA] hover:text-[#B23A24] transition-colors">Nouveautés</Link>
                <Link href="/atelier#originals" onClick={() => setAtelierOpen(false)} className="block px-5 py-2.5 text-xs uppercase tracking-wide hover:bg-[#F2F0EA] hover:text-[#B23A24] transition-colors">Originaux</Link>
                <Link href="/atelier#prints" onClick={() => setAtelierOpen(false)} className="block px-5 py-2.5 text-xs uppercase tracking-wide hover:bg-[#F2F0EA] hover:text-[#B23A24] transition-colors">Prints</Link>
                {hasActiveDrop && (
                  <Link href="/atelier#drops" onClick={() => setAtelierOpen(false)} className="flex items-center gap-2 px-5 py-2.5 text-xs uppercase tracking-wide hover:bg-[#F2F0EA] hover:text-[#B23A24] transition-colors">
                    Drops
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B23A24] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#B23A24]"></span></span>
                  </Link>
                )}
                <Link href="/atelier#bd" onClick={() => setAtelierOpen(false)} className="block px-5 py-2.5 text-xs uppercase tracking-wide hover:bg-[#F2F0EA] hover:text-[#B23A24] transition-colors">Bande dessinée</Link>
              </div>
            )}
          </div>
          <Link href="/commissions" onClick={handleCommissionsClick} className="hover:text-[#181614] normal-case">Commissions</Link>
        </nav>
        <div className="flex items-center gap-3">
          <a href="https://www.instagram.com/drdssin_" target="_blank" rel="noopener noreferrer" aria-label="Instagram @drdssin_" className="hidden md:flex items-center justify-center w-9 h-9 text-[#3A3631] hover:text-[#B23A24]">
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" /></svg>
          </a>
          <Link href="/compte" aria-label="Mon compte" className="flex items-center justify-center w-9 h-9 text-[#3A3631] hover:text-[#181614]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="3.5" /><path d="M4.5 20c1-3.5 4-5.5 7.5-5.5s6.5 2 7.5 5.5" strokeLinecap="round" /></svg>
          </Link>
          <CartButton />
          <button onClick={() => setMenuOpen(v => !v)} aria-label={menuOpen ? "Fermer" : "Menu"} className="md:hidden flex flex-col gap-1.5 p-2 -mr-2">
            <span className={`block w-5 h-px bg-[#181614] transition-transform ${menuOpen ? "translate-y-[3px] rotate-45" : ""}`} />
            <span className={`block w-5 h-px bg-[#181614] transition-transform ${menuOpen ? "-translate-y-[3px] -rotate-45" : ""}`} />
          </button>
        </div>
      </div>
      {menuOpen && (
        <nav className="md:hidden border-t border-[#DEDAD1] bg-[#FAFAF8] px-6 py-5 flex flex-col gap-1 text-xs uppercase tracking-wide font-medium text-[#3A3631]">
          <div>
            <button onClick={() => setAtelierOpen(v => !v)} className="w-full flex items-center justify-between py-2.5 hover:text-[#181614]">
              Atelier
              <span className={`text-[8px] transition-transform duration-200 ${atelierOpen ? "rotate-180" : ""}`}>▼</span>
            </button>
            {atelierOpen && (
              <div className="pl-4 flex flex-col gap-0 border-l border-[#DEDAD1] ml-1 mb-1">
                <Link href="/nouveautes" onClick={() => { setMenuOpen(false); setAtelierOpen(false); }} className="py-2 hover:text-[#B23A24]">Nouveautés</Link>
                <Link href="/atelier#originals" onClick={() => { setMenuOpen(false); setAtelierOpen(false); }} className="py-2 hover:text-[#B23A24]">Originaux</Link>
                <Link href="/atelier#prints" onClick={() => { setMenuOpen(false); setAtelierOpen(false); }} className="py-2 hover:text-[#B23A24]">Prints</Link>
                {hasActiveDrop && (
                  <Link href="/atelier#drops" onClick={() => { setMenuOpen(false); setAtelierOpen(false); }} className="py-2 flex items-center gap-2 hover:text-[#B23A24]">
                    Drops
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#B23A24] opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-[#B23A24]"></span></span>
                  </Link>
                )}
                <Link href="/atelier#bd" onClick={() => { setMenuOpen(false); setAtelierOpen(false); }} className="py-2 hover:text-[#B23A24]">Bande dessinée</Link>
              </div>
            )}
          </div>
          <Link href="/commissions" onClick={handleCommissionsClick} className="py-2.5 hover:text-[#181614] normal-case">Commissions</Link>
        </nav>
      )}
    </header>
  );
}
