"use client";

import { useState, useRef } from "react";
import BackToTopButton from "../../components/BackToTopButton";

type CategoryKey = "reference" | "imagination" | "provisuel" | "surmesure";
type SizeKey = "A5" | "A4" | "A3" | "A2";
type ColorKey = "nb" | "color";
type MediumKey = "traditionnel" | "digital" | "lesdeux";
type DigitalSizeKey = "A5" | "A4" | "A3" | "A2" | "A1";
type PrintSizeKey = "A5" | "A4" | "A3" | "A2";

const CATEGORIES: { key: CategoryKey; title: string; description: string }[] = [
  {
    key: "reference",
    title: "D'après référence",
    description: "À partir d'une photo, d'un lieu, d'une personne, une scène réelle ou une œuvre existante — reproduction fidèle, interprétation libre, ou mélange des deux. Je peux mettre en scène des personnes dans un décor choisi, reproduire un lieu avec ses habitants, ou m'inspirer partiellement d'une référence.",
  },
  {
    key: "imagination",
    title: "Imagination",
    description: "Tu décris une idée, un univers, un personnage, un lieu imaginaire, une ambiance, une BD — je crée de A à Z avec mon style. Peut partir de zéro ou s'inspirer partiellement d'une référence. Croquis, illustration poussée, création de personnage, planche BD, affiche artistique : tout est possible.",
  },
  {
    key: "surmesure",
    title: "Sur mesure",
    description: "Peinture (aquarelle, acrylique, huile), illustration multi-pages, commande longue durée, projet hybride… Tout ce qui ne rentre pas dans les catégories ci-dessus. Décris ton projet, on construit ensemble le tarif et le planning.",
  },
  {
    key: "provisuel",
    title: "Projet visuel",
    description: "Design d'affiche, identité visuelle, projet graphique professionnel pour entreprise ou particulier, création de logo illustré, supports de communication, packaging… Du croquis exploratoire au rendu final livrable. Devis personnalisé selon le projet.",
  },
];

// Prix physique (original inclus, livraison en sus)
const PRICES: Record<CategoryKey, Partial<Record<SizeKey, Record<ColorKey, number>>>> = {
  reference:  { A5: { nb: 25, color: 30 }, A4: { nb: 39, color: 46 }, A3: { nb: 49, color: 62 }, A2: { nb: 90, color: 100 } },
  imagination:{ A5: { nb: 30, color: 35 }, A4: { nb: 44, color: 51 }, A3: { nb: 55, color: 68 }, A2: { nb: 95, color: 105 } },
  provisuel:  {},
  surmesure:  {},
};

// Prix mail (sans original, sans livraison)
const PRICES_MAIL: Record<CategoryKey, Partial<Record<SizeKey, Record<ColorKey, number>>>> = {
  reference:  { A5: { nb: 20, color: 25 }, A4: { nb: 33, color: 40 }, A3: { nb: 41, color: 54 }, A2: { nb: 78, color: 88 } },
  imagination:{ A5: { nb: 25, color: 30 }, A4: { nb: 38, color: 45 }, A3: { nb: 47, color: 60 }, A2: { nb: 83, color: 93 } },
  provisuel:  {},
  surmesure:  {},
};

// Prix digital A5→A1 par catégorie
const DIGITAL_COMMISSION_PRICES: Record<"reference" | "imagination", Record<DigitalSizeKey, Record<ColorKey, number>>> = {
  reference: {
    A5: { nb: 25, color: 30 },
    A4: { nb: 39, color: 46 },
    A3: { nb: 49, color: 62 },
    A2: { nb: 90, color: 100 },
    A1: { nb: 120, color: 140 },
  },
  imagination: {
    A5: { nb: 30, color: 35 },
    A4: { nb: 44, color: 51 },
    A3: { nb: 55, color: 68 },
    A2: { nb: 95, color: 105 },
    A1: { nb: 125, color: 145 },
  },
};

const PRINT_PRICES: Record<PrintSizeKey, number> = {
  A5: 12, A4: 19, A3: 32, A2: 59,
};
const PRINT_SIZES: PrintSizeKey[] = ["A5", "A4", "A3", "A2"];
const DIGITAL_SIZES: DigitalSizeKey[] = ["A5", "A4", "A3", "A2", "A1"];

const MEDIUMS: { key: MediumKey; label: string; sub: string }[] = [
  { key: "traditionnel", label: "Traditionnel",  sub: "Encre, aquarelle, acrylique, crayon… — original physique inclus" },
  { key: "digital",      label: "Digital",        sub: "Fichier numérique — email et/ou print" },
  { key: "lesdeux",      label: "Les deux",       sub: "Line art à l'encre + couleur digitale — email et/ou print" },
];

const SCAN_SUPPLEMENT: Record<string, number> = {
  A5: 2, A4: 4, A3: 10, A2: 20, A1: 35,
};

const TRADI_EMAIL_PRICES: Record<PrintSizeKey, number> = {
  A5: 3, A4: 6, A3: 12, A2: 25,
};

const DIGITAL_EMAIL_PRICE = 3;

function fmt2(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

const labelCls = "block text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-3";
const rowCls = "flex items-center gap-3 p-3 border cursor-pointer transition-colors";
const isDevis = (c: CategoryKey) => c === "provisuel" || c === "surmesure";

export default function CommissionsPage() {
  const [category, setCategory] = useState<CategoryKey>("reference");
  const [size, setSize]         = useState<SizeKey>("A5");
  const [sizeQtys, setSizeQtys] = useState<Partial<Record<SizeKey, number>>>({});
  const [color, setColor]       = useState<ColorKey>("nb");
  const [medium, setMedium]     = useState<MediumKey>("traditionnel");
  const [digitalSize, setDigitalSize] = useState<DigitalSizeKey>("A5");
  const [delivery, setDelivery] = useState<"physique" | "mail">("physique");
  const [deliveryDigital, setDeliveryDigital] = useState<"email" | "print">("print");
  const [refFiles, setRefFiles] = useState<File[]>([]);
  const [refUrls, setRefUrls] = useState<string[]>([]);
  const [uploadingRef, setUploadingRef] = useState(false);

  async function handleRefFilesChange(newFiles: File[]) {
    setRefFiles(prev => [...prev, ...newFiles]);
    setUploadingRef(true);
    const uploaded: string[] = [];
    for (const file of newFiles) {
      try {
        // Petite pause pour s'assurer que le timestamp est unique
        await new Promise(r => setTimeout(r, 1100));
        const sigRes = await fetch("/api/upload-signature", { method: "GET" });
        const sig = await sigRes.json();
        if (sig.cloudName) {
          const fd = new FormData();
          fd.append("file", file as Blob);
          fd.append("api_key", sig.apiKey);
          fd.append("timestamp", String(sig.timestamp));
          fd.append("signature", sig.signature);
          fd.append("folder", sig.folder);
          const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, { method: "POST", body: fd });
          const data = await res.json();
          if (data.secure_url) uploaded.push(data.secure_url);
          else console.error("Cloudinary error:", data);
        }
      } catch (e) { console.error("Upload photo erreur:", e); }
    }
    setRefUrls(prev => [...prev, ...uploaded]);
    setUploadingRef(false);
  }
  const [description, setDescription] = useState("");
  const [formats, setFormats] = useState("");
  const [printQtys, setPrintQtys] = useState<Partial<Record<PrintSizeKey, number>>>({});
  const [digitalQtys, setDigitalQtys] = useState<Partial<Record<PrintSizeKey, number>>>({});
  const [digitalEmailQtys, setDigitalEmailQtys] = useState<Partial<Record<string, number>>>({});
  const [tradiEmailQtys, setTradiEmailQtys] = useState<Partial<Record<PrintSizeKey, number>>>({});
  const [wantDigitalEmail, setWantDigitalEmail] = useState(false);
  const [wantTradiEmail, setWantTradiEmail] = useState(false);
  const [charteAccepted, setCharteAccepted] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]         = useState(false);
  const [error, setError]       = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const isDigital   = medium === "digital" || medium === "lesdeux";
  const isLesDeux   = medium === "lesdeux";
  const hasDevis    = isDevis(category);
  const isByMail    = delivery === "mail";

  const digitalCatKey = (category === "reference" || category === "imagination") ? category : null;
  const priceTable  = isByMail ? PRICES_MAIL : PRICES;
  // Calcul total tradi avec multi-formats
  const tradiTotal = hasDevis ? 0 : (["A5", "A4", "A3", "A2"] as SizeKey[]).reduce((sum, s) => {
    const qty = sizeQtys[s] || 0;
    const price = priceTable[category]?.[s]?.[color] ?? 0;
    return sum + qty * price;
  }, 0);
  const tradiBasePrice = hasDevis ? null : tradiTotal > 0 ? tradiTotal : null;
  // Format principal pour l'acompte (le plus grand format commandé)
  const mainSize: SizeKey = (["A2", "A3", "A4", "A5"] as SizeKey[]).find(s => (sizeQtys[s] || 0) > 0) || size;

  // Pour digital et les deux — total par format × quantité + supplément scan si Les deux
  const digitalTotal = digitalCatKey
    ? DIGITAL_SIZES.reduce((s, k) => {
        const qty = (digitalQtys as Partial<Record<DigitalSizeKey, number>>)[k] || 0;
        const price = DIGITAL_COMMISSION_PRICES[digitalCatKey]?.[k]?.[color] ?? 0;
        const scan = isLesDeux ? (SCAN_SUPPLEMENT[k] || 0) : 0;
        return s + qty * (price + scan);
      }, 0)
    : 0;

  const basePrice = isDigital ? (digitalTotal > 0 ? digitalTotal : null) : tradiBasePrice;

  const deposit = hasDevis ? null : isDigital
    ? 10
    : mainSize === "A5" ? 5
    : mainSize === "A4" ? 8
    : mainSize === "A3" ? 10
    : 20;

  const printsTotal = PRINT_SIZES.reduce((s, k) => s + (printQtys[k] || 0) * PRINT_PRICES[k], 0);
  const total = isDigital ? digitalTotal : (tradiBasePrice ?? 0) + printsTotal;

  function setPrintQty(k: PrintSizeKey, v: number) {
    setPrintQtys(p => ({ ...p, [k]: Math.max(0, v) }));
  }
  function setDigitalQty(k: PrintSizeKey, v: number) {
    setDigitalQtys(p => ({ ...p, [k]: Math.max(0, v) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { setError("Merci de décrire ton projet."); return; }
    if (category === "reference" && refFiles.length === 0) { setError("Une photo de référence est obligatoire pour cette catégorie."); return; }
    if (isDigital && !charteAccepted) { setError("Merci d'accepter la charte d'utilisation."); return; }
    setError("");
    setSubmitting(true);

    // Uploader la photo de référence vers Cloudinary directement depuis le navigateur
    const referenceUrl = refUrls.join(",");

    const printsSummary  = PRINT_SIZES.filter(k => (printQtys[k] || 0) > 0).map(k => `${printQtys[k]}× Print ${k} (${fmt2(PRINT_PRICES[k] * (printQtys[k] || 0))})`).join(", ");
    const digitalSummary = isDigital ? `${medium === "lesdeux" ? "Les deux" : "Digital"} ${digitalSize} ${color === "nb" ? "N&B" : "Couleur"}` : "";

    const body = new FormData();
    body.append("category", CATEGORIES.find(c => c.key === category)?.title || category);
    if (!hasDevis && basePrice !== null) {
      const sizesSummary = (["A5", "A4", "A3", "A2"] as SizeKey[])
        .filter(s => (sizeQtys[s] || 0) > 0)
        .map(s => `${sizeQtys[s]}× ${s}`)
        .join(", ");
      body.append("size", sizesSummary || mainSize);
      body.append("color",          color === "nb" ? "Noir & blanc" : "Couleur");
      body.append("estimatedPrice", fmt2(basePrice));
      body.append("deposit",        fmt2(deposit!));
    }
    body.append("medium", MEDIUMS.find(m => m.key === medium)?.label || medium);
    body.append("description", description);
    if (formats) body.append("formats", formats);
    if (referenceUrl) body.append("referenceUrl", referenceUrl);
    if (printsSummary)  body.append("prints",  printsSummary);
    if (digitalSummary) body.append("digital", digitalSummary);

    if (!hasDevis) body.append("paymentMethod", paymentMethod);
    if (!hasDevis) body.append("mainSize", mainSize);

    try {
      const res = await fetch("/api/commissions", { method: "POST", body });
      if (res.status === 400) {
        const data = await res.json();
        setError(data.error || "Erreur dans le formulaire.");
        return;
      }
      const data = await res.json();
      if (data.devis) {
        // Devis — afficher confirmation sans paiement
        setSent(true);
      } else if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setSent(true);
      }
    } catch {
      setError("Une erreur est survenue. Réessaie ou contacte-moi directement.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-24 text-center">
        <p className="font-serif text-3xl text-[#181614] mb-4">
          {hasDevis ? "Demande reçue ✓" : "Redirection…"}
        </p>
        <p className="text-[#8C8780] text-sm">
          {hasDevis
            ? "Je te réponds dans les 48h avec un devis personnalisé. Merci !"
            : "Tu vas être redirigé vers le paiement…"
          }
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 md:px-8 py-16">
      <h1 className="font-serif text-[36px] text-[#181614] mb-2">Commissions</h1>
      <p className="text-sm text-[#8C8780] mb-10 max-w-2xl">
        Du croquis au résultat le plus poussé — observation, imagination, design, N&B ou couleur, traditionnel ou digital.{" "}
        <strong className="text-[#181614]">L'œuvre originale est toujours incluse.</strong>
      </p>

      <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-x-12 gap-y-8 items-start">

        {/* ── COLONNE GAUCHE ── */}
        <div className="flex flex-col gap-8">

          {/* 1. Catégorie */}
          <section>
            <label className={labelCls}>1 — Catégorie</label>
            <div className="flex flex-col gap-2">
              {CATEGORIES.map(c => (
                <label key={c.key} className={`flex gap-4 p-4 border cursor-pointer transition-colors ${category === c.key ? "border-[#B23A24] bg-[#FAF8F5]" : "border-[#DEDAD1]"}`}>
                  <input type="radio" name="category" checked={category === c.key} onChange={() => setCategory(c.key)} className="mt-1 accent-[#B23A24] flex-shrink-0" />
                  <div>
                    <div className="text-sm font-semibold text-[#181614]">{c.title}</div>
                    <div className="text-xs text-[#8C8780] mt-1 leading-relaxed">{c.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </section>

          {/* 2. Médium */}
          <section>
            <label className={labelCls}>{hasDevis ? "2" : "2"} — Médium</label>
            <div className="flex flex-col gap-2">
              {MEDIUMS.map(m => (
                <label key={m.key} className={`${rowCls} ${medium === m.key ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                  <input type="radio" name="medium" checked={medium === m.key} onChange={() => setMedium(m.key)} className="accent-[#B23A24]" />
                  <div>
                    <span className="text-sm font-medium">{m.label}</span>
                    <span className="text-xs text-[#8C8780] ml-2">{m.sub}</span>
                  </div>
                </label>
              ))}
            </div>

            {/* Charte digital */}
            {isDigital && (
              <div className="mt-3 p-4 border border-[#181614] bg-[#F2F0EA]">
                <p className="text-xs text-[#3A3631] leading-relaxed mb-3">
                  <strong>Charte d&rsquo;utilisation — original numérique :</strong> le fichier livré est signé digitalement et destiné à un usage personnel ou commercial selon accord. Je m&rsquo;engage à ne pas réutiliser, revendre ou diffuser l&rsquo;œuvre sans ton accord explicite. Tu es propriétaire de ce fichier.
                </p>
                <label className="flex items-start gap-2 cursor-pointer">
                  <input type="checkbox" checked={charteAccepted} onChange={e => setCharteAccepted(e.target.checked)} className="mt-0.5 accent-[#B23A24]" />
                  <span className="text-xs text-[#3A3631]">J&rsquo;accepte la charte d&rsquo;utilisation de l&rsquo;original numérique</span>
                </label>
              </div>
            )}
          </section>

          {/* 3. Rendu */}
          {!hasDevis && (
            <section>
              <label className={labelCls}>3 — Rendu</label>
              <div className="flex gap-3">
                <label className={`flex-1 flex items-center gap-3 p-4 border cursor-pointer transition-colors ${color === "nb" ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                  <input type="radio" name="color" checked={color === "nb"} onChange={() => setColor("nb")} className="accent-[#B23A24]" />
                  <div>
                    <div className="text-sm font-semibold">Noir & blanc</div>
                    <div className="text-xs text-[#8C8780]">Encre, crayon, lavis</div>
                  </div>
                </label>
                <label className={`flex-1 flex items-center gap-3 p-4 border cursor-pointer transition-colors ${color === "color" ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                  <input type="radio" name="color" checked={color === "color"} onChange={() => setColor("color")} className="accent-[#B23A24]" />
                  <div>
                    <div className="text-sm font-semibold">Couleur</div>
                    <div className="text-xs text-[#8C8780]">{size === "A5" ? "Aquarelle" : "Aquarelle et/ou acrylique"}</div>
                  </div>
                </label>
              </div>
            </section>
          )}

          {/* 4. Formats — compteurs quantité avec prix */}
          {!hasDevis && !isDigital && (
            <section>
              <label className={labelCls}>4 — Formats et quantités</label>
              <p className="text-xs text-[#8C8780] mb-3">Tu peux commander plusieurs formats et plusieurs exemplaires.</p>
              <div className="flex flex-col gap-2">
                {(["A5", "A4", "A3", "A2"] as SizeKey[]).map(s => {
                  const catKey = (category === "reference" || category === "imagination") ? category : null;
                  const priceTable = isByMail ? PRICES_MAIL : PRICES;
                  const price = catKey ? priceTable[catKey]?.[s]?.[color] ?? null : null;
                  const qty = sizeQtys[s] || 0;
                  return (
                    <div key={s} className={`flex items-center justify-between gap-3 px-4 py-3 border transition-colors ${qty > 0 ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                      <div>
                        <span className="text-sm font-medium">{s}</span>
                        <span className="text-xs text-[#8C8780] ml-2">
                          {s === "A5" ? "14,8 × 21 cm" : s === "A4" ? "21 × 29,7 cm" : s === "A3" ? "29,7 × 42 cm" : "42 × 59,4 cm"}
                          {price ? ` — ${fmt2(price)}` : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setSizeQtys(p => ({ ...p, [s]: Math.max(0, (p[s] || 0) - 1) }))} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">−</button>
                        <span className="font-mono text-sm w-4 text-center">{qty}</span>
                        <button type="button" onClick={() => setSizeQtys(p => ({ ...p, [s]: (p[s] || 0) + 1 }))} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Formats digitaux avec quantités — prints ET email indépendants */}
          {isDigital && !hasDevis && (
            <section>
              <label className={labelCls}>5 — Formats et exemplaires</label>

              {isLesDeux && (
                <p className="text-xs text-[#8C8780] mb-3">
                  ✦ Supplément scan inclus dans le prix
                </p>
              )}

              <p className="text-xs font-semibold text-[#3A3631] mb-2 uppercase tracking-wide">Tirages print</p>
              <div className="flex flex-col gap-2 mb-4">
                {DIGITAL_SIZES.map(s => {
                  const price = (digitalCatKey ? DIGITAL_COMMISSION_PRICES[digitalCatKey]?.[s]?.[color] : null) ?? 0;
                  const scan = isLesDeux ? (SCAN_SUPPLEMENT[s] || 0) : 0;
                  const qty = (digitalQtys as Partial<Record<DigitalSizeKey, number>>)[s] || 0;
                  return (
                    <div key={s} className={`flex items-center justify-between gap-3 px-4 py-3 border transition-colors ${qty > 0 ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                      <div>
                        <span className="text-sm font-medium">Print {s}</span>
                        <span className="text-xs text-[#8C8780] ml-2">{fmt2(price + scan)}{scan > 0 ? ` (dont +${scan}€ scan)` : ""}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setDigitalQtys((p: Partial<Record<string, number>>) => ({ ...p, [s]: Math.max(0, (p[s] || 0) - 1) }))} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">−</button>
                        <span className="font-mono text-sm w-4 text-center">{qty}</span>
                        <button type="button" onClick={() => setDigitalQtys((p: Partial<Record<string, number>>) => ({ ...p, [s]: (p[s] || 0) + 1 }))} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs font-semibold text-[#3A3631] mb-2 uppercase tracking-wide">Fichier par e-mail</p>
              <label className={`flex items-center justify-between gap-3 px-4 py-3 border cursor-pointer transition-colors ${wantDigitalEmail ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                <div>
                  <span className="text-sm font-medium">Fichier haute résolution par e-mail</span>
                  <span className="text-xs text-[#8C8780] ml-2">{fmt2(DIGITAL_EMAIL_PRICE)}</span>
                </div>
                <input type="checkbox" checked={wantDigitalEmail} onChange={e => setWantDigitalEmail(e.target.checked)} className="accent-[#B23A24] w-4 h-4" />
              </label>
            </section>
          )}

          {/* Scan email optionnel pour tradi et les deux */}
          {(!isDigital || isLesDeux) && !hasDevis && (
            <section>
              <label className={labelCls}>5 — Options supplémentaires</label>
              <p className="text-xs font-semibold text-[#3A3631] mb-2 uppercase tracking-wide">Tirages print</p>
              <p className="text-xs text-[#8C8780] mb-2">En plus de l&rsquo;original, tu peux commander des tirages papier.</p>
              <div className="flex flex-col gap-2 mb-4">
                {PRINT_SIZES.map(s => {
                  const qty = printQtys[s] || 0;
                  return (
                    <div key={s} className={`flex items-center justify-between gap-3 px-4 py-3 border transition-colors ${qty > 0 ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                      <div>
                        <span className="text-sm font-medium">Format {s}</span>
                        <span className="text-xs text-[#8C8780] ml-2">{fmt2(PRINT_PRICES[s])}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => setPrintQty(s, qty - 1)} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">−</button>
                        <span className="font-mono text-sm w-4 text-center">{qty}</span>
                        <button type="button" onClick={() => setPrintQty(s, qty + 1)} className="w-7 h-7 border border-[#DEDAD1] flex items-center justify-center hover:border-[#181614] text-sm">+</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs font-semibold text-[#3A3631] mt-4 mb-2 uppercase tracking-wide">Scan par e-mail</p>
              <label className={`flex items-center justify-between gap-3 px-4 py-3 border cursor-pointer transition-colors ${wantTradiEmail ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                <div>
                  <span className="text-sm font-medium">Scan haute résolution par e-mail</span>
                  <span className="text-xs text-[#8C8780] ml-2">A5 3€ · A4 6€ · A3 12€ · A2 25€</span>
                </div>
                <input type="checkbox" checked={wantTradiEmail} onChange={e => setWantTradiEmail(e.target.checked)} className="accent-[#B23A24] w-4 h-4" />
              </label>
            </section>
          )}

        </div>{/* fin colonne gauche */}

        {/* ── COLONNE DROITE ── */}
        <div className="flex flex-col gap-8">

          {/* Photo de référence */}
          <section>
            <label className={labelCls}>
              {hasDevis ? "1" : "A"} — Photo de référence
              {category === "reference"
                ? <span className="text-[#B23A24] ml-1 normal-case font-normal">— obligatoire *</span>
                : <span className="text-[#8C8780] ml-1 normal-case font-normal">(optionnel)</span>
              }
            </label>
            <p className="text-xs text-[#8C8780] mb-3">
              {category === "reference"
                ? "Une photo, une capture d'écran internet ou toute image dont tu veux que je m'inspire — partiellement ou totalement. Une capture d'écran suffit."
                : "Une image dont tu veux que je m'inspire. Pas obligatoire — une capture d'écran internet suffit."
              }
            </p>
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors cursor-pointer p-6 text-center ${category === "reference" && refFiles.length === 0 ? "border-[#B23A24]/40 hover:border-[#B23A24]" : "border-[#DEDAD1] hover:border-[#181614]"}`}>
              <span className="text-2xl">📎</span>
              <span className="text-sm font-medium text-[#3A3631]">
                {uploadingRef ? "Upload en cours…" : refFiles.length > 0 ? `${refFiles.length} photo${refFiles.length > 1 ? "s" : ""} sélectionnée${refFiles.length > 1 ? "s" : ""}` : "Clique pour ajouter des photos"}
              </span>
              <span className="text-xs text-[#8C8780]">JPG, PNG, capture d&rsquo;écran… — autant que tu veux</span>
              <input ref={fileRef} type="file" accept="image/*" multiple onChange={e => handleRefFilesChange(Array.from(e.target.files || []))} className="hidden" />
            </label>
            {refFiles.length > 0 && (
              <div className="flex flex-col gap-1 mt-2">
                {refFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 bg-[#F2F0EA] border border-[#DEDAD1]">
                    <span className="text-xs font-medium">
                      {refUrls[i] ? <span className="text-[#3A7D44]">✓ {f.name}</span> : <span className="text-[#8C8780]">⏳ {f.name}</span>}
                    </span>
                    <button type="button" onClick={() => {
                      setRefFiles(prev => prev.filter((_, j) => j !== i));
                      setRefUrls(prev => prev.filter((_, j) => j !== i));
                    }} className="text-xs text-[#8C8780] hover:text-[#B23A24]">Supprimer</button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Description */}
          <section>
            <label className={labelCls}>{hasDevis ? "2" : "B"} — Décris ton projet *</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={6}
              placeholder={hasDevis
                ? "Décris ton projet en détail — objectif, style, références, contraintes, deadline…"
                : "Décris ce que tu imagines — sujet, ambiance, style, références, contraintes… Plus c'est précis, mieux c'est. Même une idée floue est la bienvenue."
              }
              className="w-full border border-[#DEDAD1] px-3 py-3 text-sm focus:outline-none focus:border-[#181614] resize-none"
              required
            />
          </section>

          {/* Formats et exemplaires souhaités — uniquement pour sur mesure et projet visuel */}
          {hasDevis && (
            <section>
              <label className={labelCls}>3 — Formats et exemplaires souhaités (optionnel)</label>
              <textarea
                rows={3}
                value={formats}
                onChange={e => setFormats(e.target.value)}
                placeholder={"Ex : 2 affiches A3 en traditionnel + 1 fichier digital A2, ou 5 exemplaires A4 print… Même approximatif, ça m'aide à te faire un devis précis."}
                className="w-full border border-[#DEDAD1] px-3 py-3 text-sm focus:outline-none focus:border-[#181614] resize-none"
              />
            </section>
          )}

          {/* Récapitulatif */}
          {!hasDevis && basePrice !== null && (
            <section className="border border-[#DEDAD1] p-5 flex flex-col gap-2 bg-[#F2F0EA]">
              <p className="text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-1">Récapitulatif</p>
              <div className="flex justify-between text-sm text-[#3A3631]">
                <span>Commission {isDigital ? "" : size} {color === "nb" ? "N&B" : "Couleur"} {isDigital ? "Digital" : isByMail ? "(mail)" : "+ original"}</span>
                <span className="font-mono">{fmt2(isDigital ? digitalTotal : (basePrice ?? 0))}</span>
              </div>
              {printsTotal > 0 && (
                <div className="flex justify-between text-sm text-[#3A3631]">
                  <span>Prints</span>
                  <span className="font-mono">{fmt2(printsTotal)}</span>
                </div>
              )}
              {digitalTotal > 0 && (
                <div className="flex justify-between text-sm text-[#3A3631]">
                  <span>Exemplaires digitaux</span>
                  <span className="font-mono">{fmt2(digitalTotal)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-semibold text-[#181614] pt-2 border-t border-[#DEDAD1]">
                <span>Total estimé</span>
                <span className="font-mono">{fmt2(total)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#B23A24] font-medium mt-1">
                <span>Acompte croquis — demandé avant envoi du schéma, déduit du total si tu valides</span>
                <span className="font-mono">{fmt2(deposit!)}</span>
              </div>
            </section>
          )}

          {error && <p className="text-sm text-[#B23A24]">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full py-4 bg-[#181614] text-white text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors disabled:opacity-50">
            {submitting
              ? hasDevis ? "Envoi en cours…" : "Redirection vers le paiement…"
              : hasDevis ? "Envoyer ma demande" : "Valider et payer l'acompte"}
          </button>

          <p className="text-xs text-[#8C8780] text-center">
            {category === "provisuel"
              ? "J'étudie ta demande et te réponds par mail sous 48h. Si le projet correspond à mes capacités, je te soumets une proposition avec un devis — l'acompte ne sera demandé qu'à ce moment-là."
              : hasDevis
              ? "Je te réponds dans les 48h avec un devis personnalisé."
              : "Tu seras redirigé vers le paiement sécurisé (Stripe ou PayPal). Je commence le croquis dès réception de l'acompte."
            }
          </p>

        </div>{/* fin colonne droite */}

      </form>
      <BackToTopButton />
    </main>
  );
}
