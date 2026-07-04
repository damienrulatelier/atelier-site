import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[#DEDAD1] mt-auto">
      <div className="max-w-6xl mx-auto px-8 py-14">
        <div className="flex flex-wrap justify-between gap-8 pb-8">
          <div>
            <h5 className="text-[11px] uppercase tracking-wide font-semibold text-[#8C8780] mb-3">
              Atelier
            </h5>
            <p className="text-sm text-[#3A3631]">Damien Rul</p>
            <p className="text-sm text-[#3A3631]">Montpellier, France</p>
          </div>
          <div>
            <h5 className="text-[11px] uppercase tracking-wide font-semibold text-[#8C8780] mb-3">
              Informations
            </h5>
            <Link href="/legal" className="text-sm text-[#3A3631] hover:text-[#B23A24] block">
              Mentions légales & CGV
            </Link>
          </div>
          <div>
            <h5 className="text-[11px] uppercase tracking-wide font-semibold text-[#8C8780] mb-3">
              Contact
            </h5>
            <a
              href="mailto:damienrul34@gmail.com"
              className="text-sm text-[#3A3631] hover:text-[#B23A24]"
            >
              damienrul34@gmail.com
            </a>
          </div>
          <div>
            <h5 className="text-[11px] uppercase tracking-wide font-semibold text-[#8C8780] mb-3">
              Suivre l&rsquo;atelier
            </h5>
            <a
              href="https://www.instagram.com/drdssin_"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#3A3631] hover:text-[#B23A24] block"
            >
              Instagram
            </a>
            <a
              href="https://www.tiktok.com/@drdssin"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[#3A3631] hover:text-[#B23A24] block"
            >
              TikTok
            </a>
          </div>
        </div>
        <div className="border-t border-[#DEDAD1] pt-6 flex flex-wrap justify-between gap-3 text-xs text-[#8C8780]">
          <span>© 2026 Damien Rul</span>
          <span className="font-mono">Paiement sécurisé · Carte & PayPal</span>
          <Link href="/legal" className="hover:text-[#181614]">Mentions légales & CGV</Link>
        </div>
      </div>
    </footer>
  );
}
