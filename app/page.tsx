import Link from "next/link";
export default function WelcomePage() {
  return (
    <main className="min-h-screen bg-[#181614] flex flex-col">
      {/* Logo */}
      <div className="px-8 pt-10 pb-0">
        <p className="font-serif italic text-[#FAFAF8] text-xl">
          Damien Rul <span className="text-[#B23A24] not-italic">·</span> Atelier
        </p>
      </div>
      {/* Contenu principal */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="text-center mb-16 max-w-xl">
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#B23A24] font-semibold mb-5">
            Illustration · Bande dessinée · Commission
          </p>
          <h1 className="font-serif text-[clamp(36px,7vw,72px)] leading-[1.0] text-[#FAFAF8] mb-6">
            Chaque pièce porte<br />
            un peu <em className="text-[#B23A24] not-italic italic font-normal">de vous</em>.
          </h1>
          <p className="text-[15px] text-[#8C8780] max-w-md mx-auto leading-relaxed">
            Œuvres originales, tirages numérotés et bande dessinée — ou une commission entièrement pensée pour toi.
          </p>
        </div>
        {/* Deux grandes tuiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
          {/* Atelier */}
          <Link
            href="/atelier"
            className="group relative border border-[#3A3631] bg-[#2A2420] p-10 flex flex-col justify-between min-h-[260px] hover:border-[#B23A24] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#B23A24] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C8780] font-semibold mb-4">
                Originaux · Prints · Drops · BD
              </p>
              <h2 className="font-serif text-[36px] text-[#FAFAF8] leading-tight group-hover:text-[#E8D9D3] transition-colors">
                Atelier
              </h2>
              <p className="text-[13px] text-[#8C8780] mt-3 leading-relaxed max-w-[240px]">
                Pièces uniques et tirages numérotés, signés et dédicacés à la main.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-8 text-[12px] uppercase tracking-wide font-semibold text-[#FAFAF8] group-hover:text-[#B23A24] transition-colors">
              Entrer <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
            </div>
          </Link>
          {/* Commissions */}
          <Link
            href="/commissions"
            className="group relative border border-[#3A3631] bg-[#2A2420] p-10 flex flex-col justify-between min-h-[260px] hover:border-[#B23A24] transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[#B23A24] opacity-0 group-hover:opacity-5 transition-opacity duration-300" />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8C8780] font-semibold mb-4">
                Sur mesure · Personnalisé
              </p>
              <h2 className="font-serif text-[36px] text-[#FAFAF8] leading-tight group-hover:text-[#E8D9D3] transition-colors">
                Commissions
              </h2>
              <p className="text-[13px] text-[#8C8780] mt-3 leading-relaxed max-w-[240px]">
                Une œuvre créée spécialement pour toi — portrait, illustration, projet hybride.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-8 text-[12px] uppercase tracking-wide font-semibold text-[#FAFAF8] group-hover:text-[#B23A24] transition-colors">
              Démarrer <span className="transition-transform group-hover:translate-x-1 duration-200">→</span>
            </div>
          </Link>
        </div>
        {/* Instagram */}
        <a
          href="https://www.instagram.com/drdssin_"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-12 text-[11px] uppercase tracking-[0.2em] text-[#8C8780] hover:text-[#FAFAF8] transition-colors"
        >
          @drdssin_
        </a>
      </div>
    </main>
  );
}
