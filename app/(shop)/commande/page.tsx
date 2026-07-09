"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "../../components/CartContext";
import { getSessionToken } from "../../components/sessionToken";
function fmt(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}
const SHIPPING_OPTIONS = {
  mondialrelay: {
    label: "Mondial Relay",
    sub: "Retrait en point relais · 2 à 4 jours · le point relais te sera demandé par e-mail",
    price: 4.9,
  },
  poste: {
    label: "Envoi postal à domicile",
    sub: "Livré chez vous · 3 à 5 jours",
    price: 6.9,
  },
} as const;
type ShippingKey = keyof typeof SHIPPING_OPTIONS;
type LoyaltyStatus = {
  purchaseCount: number;
  freeRewardUnlocked: boolean;
  freeRewardClaimed: boolean;
};
export default function CommandePage() {
  const { lines, subtotal, totalQty, clear } = useCart();
  const router = useRouter();
  const [shipping, setShipping] = useState<ShippingKey>("mondialrelay");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    const reset = () => setSubmitting(false);
    window.addEventListener("focus", reset);
    return () => window.removeEventListener("focus", reset);
  }, []);
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [error, setError] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [form, setForm] = useState({
    fullName: "", email: "", phone: "", address: "", zip: "", city: "",
  });
  const [loyalty, setLoyalty] = useState<LoyaltyStatus | null>(null);
  useEffect(() => {
    fetch("/api/account/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => setIsLoggedIn(!!data?.email))
      .catch(() => setIsLoggedIn(false));
  }, []);
  useEffect(() => {
    if (!form.email.includes("@")) { setLoyalty(null); return; }
    const timeout = setTimeout(() => {
      fetch(`/api/loyalty?email=${encodeURIComponent(form.email)}`)
        .then((res) => res.json()).then(setLoyalty).catch(() => setLoyalty(null));
    }, 500);
    return () => clearTimeout(timeout);
  }, [form.email]);
  const shippingOpt = SHIPPING_OPTIONS[shipping];
  const freeShipping = totalQty >= 2;
  const shippingPrice = freeShipping ? 0 : shippingOpt.price;
  const total = subtotal + shippingPrice;
  useEffect(() => {
    if (!form.email.includes("@") || lines.length === 0) return;
    const timeout = setTimeout(() => {
      fetch("/api/abandoned-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email,
          items: lines.map((l) => ({ title: l.title, price: l.price, qty: l.qty })),
          total,
        }),
      }).catch(() => {});
    }, 2000);
    return () => clearTimeout(timeout);
  }, [form.email, lines, total]);
  function setField(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }
  function validateForm(): boolean {
    if (!form.fullName || !form.email || !form.address || !form.zip || !form.city) {
      setError("Merci de remplir tous les champs obligatoires de l'adresse.");
      return false;
    }
    if (!cgvAccepted) {
      setError("Merci d'accepter les conditions générales de vente pour continuer.");
      return false;
    }
    setError("");
    return true;
  }
  async function handleStripePay(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/checkout/stripe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines: lines.map((l) => ({ productId: l.productId, title: l.title, price: l.price, qty: l.qty, dedication: l.dedication, size: l.size })),
          shippingLabel: freeShipping ? `${shippingOpt.label} (offerte)` : shippingOpt.label,
          shippingPrice: shippingPrice,
          email: form.email,
          sessionToken: getSessionToken(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de paiement.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de paiement.");
      setSubmitting(false);
    }
  }
  if (lines.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-8 py-24 text-center">
        <p className="text-[#8C8780] mb-4">Ton panier est vide.</p>
        <a href="/" className="text-[#B23A24] underline text-sm">Retourner à la boutique</a>
      </main>
    );
  }
  return (
    <main className="max-w-2xl mx-auto px-8 py-14">
      <div className="flex items-center justify-between mb-10">
        <h1 className="font-serif text-3xl text-[#181614]">Finaliser la commande</h1>
        <button onClick={() => setShowCancelModal(true)} className="text-sm text-[#8C8780] hover:text-[#B23A24] transition-colors underline">Annuler</button>
      </div>
      <section className="mb-9">
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-3">Récapitulatif</h2>
        <div className="border border-[#DEDAD1] divide-y divide-[#DEDAD1]">
          {lines.map((l) => (
            <div key={l.lineId} className="px-4 py-3 text-sm">
              <div className="flex justify-between">
                <span>
                  {l.qty} × {l.title}
                  {l.size && <span className="block text-xs text-[#8C8780] mt-0.5">{l.size}</span>}
                </span>
                <span className="font-mono">{fmt(l.price * l.qty)}</span>
              </div>
              {l.isDedicated && <div className="mt-1.5 text-xs italic text-[#3A3631]">✎ {l.dedication}</div>}
            </div>
          ))}
        </div>
      </section>
      <section className="mb-9">
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-3">Adresse de livraison</h2>
        <div className="grid gap-3.5">
          <input required type="text" placeholder="Nom complet" value={form.fullName} onChange={(e) => setField("fullName", e.target.value)} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]" />
          <div className="grid grid-cols-2 gap-3.5">
            <input required type="email" placeholder="E-mail" value={form.email} onChange={(e) => setField("email", e.target.value)} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]" />
            <input type="tel" placeholder="Téléphone" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]" />
          </div>
          {loyalty?.freeRewardUnlocked && (
            <div className="bg-[#F2F0EA] border border-[#B23A24] p-4 text-sm text-[#3A3631]">
              🎁 <strong>Tu as débloqué un dessin offert !</strong> Avec déjà {loyalty.purchaseCount} commandes passées chez l&rsquo;atelier, tu peux me demander gratuitement un print, un dessin ou une commission.
            </div>
          )}
          <input required type="text" placeholder={shipping === "mondialrelay" ? "Point relais choisi (nom et adresse)" : "Numéro et rue"} value={form.address} onChange={(e) => setField("address", e.target.value)} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]" />
          <div className="grid grid-cols-2 gap-3.5">
            <input required type="text" placeholder="Code postal" value={form.zip} onChange={(e) => setField("zip", e.target.value)} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]" />
            <input required type="text" placeholder="Ville" value={form.city} onChange={(e) => setField("city", e.target.value)} className="border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614]" />
          </div>
        </div>
      </section>
      <section className="mb-9">
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-3">Mode de livraison</h2>
        {freeShipping ? (
          <div className="border border-[#3A7D44] bg-[#F0F7F0] px-4 py-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm font-semibold text-[#3A7D44]">🎉 Livraison offerte — 2 articles ou plus</div>
                <div className="text-xs text-[#8C8780] mt-0.5">Choisis ton mode d&rsquo;expédition :</div>
              </div>
              <div className="font-mono text-sm font-bold text-[#3A7D44]">0,00 €</div>
            </div>
            <div className="flex flex-col gap-2">
              {(Object.entries(SHIPPING_OPTIONS) as [ShippingKey, typeof SHIPPING_OPTIONS[ShippingKey]][]).map(([key, opt]) => (
                <label key={key} className={`flex items-center gap-3 px-4 py-3 border cursor-pointer transition-colors ${shipping === key ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                  <input type="radio" name="shipping" checked={shipping === key} onChange={() => setShipping(key)} className="accent-[#B23A24]" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">{opt.label}</div>
                    <div className="text-xs text-[#8C8780]">{opt.sub}</div>
                  </div>
                  <div className="font-mono text-sm line-through text-[#8C8780]">{fmt(opt.price)}</div>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {(Object.entries(SHIPPING_OPTIONS) as [ShippingKey, typeof SHIPPING_OPTIONS[ShippingKey]][]).map(([key, opt]) => (
              <label key={key} className={`flex items-center gap-3 px-4 py-3.5 border cursor-pointer transition-colors ${shipping === key ? "border-[#181614] bg-[#F2F0EA]" : "border-[#DEDAD1]"}`}>
                <input type="radio" name="shipping" checked={shipping === key} onChange={() => setShipping(key)} className="accent-[#B23A24]" />
                <div className="flex-1">
                  <div className="text-sm font-medium">{opt.label}</div>
                  <div className="text-xs text-[#8C8780]">{opt.sub}</div>
                </div>
                <div className="font-mono text-sm">{fmt(opt.price)}</div>
              </label>
            ))}
            <p className="text-xs text-[#8C8780] mt-1">✨ Ajoute un 2ème article pour la livraison offerte !</p>
          </div>
        )}
      </section>
      <section className="mb-9">
        <h2 className="text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-3">Paiement</h2>
        <form onSubmit={handleStripePay}>
          <p className="text-xs text-[#8C8780] mb-4">Tu seras redirigé·e vers une page Stripe sécurisée pour entrer ta carte. Aucune donnée bancaire ne passe par ce site.</p>
          {error && <p className="text-sm text-[#B23A24] mb-4">{error}</p>}
          <div className="text-sm text-[#3A3631] flex flex-col gap-1.5 border-t border-[#DEDAD1] pt-4 mb-3">
            <div className="flex justify-between">
              <span>Sous-total</span>
              <span className="font-mono">{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span>Livraison</span>
              {freeShipping ? (
                <span className="font-mono text-[#3A7D44] font-semibold">Offerte 🎉</span>
              ) : (
                <span className="font-mono">{fmt(shippingPrice)}</span>
              )}
            </div>
          </div>
          <div className="flex justify-between text-lg font-semibold pt-2 mb-6">
            <span>Total</span>
            <span className="font-mono">{fmt(total)}</span>
          </div>
          <label className="flex items-start gap-3 mb-4 cursor-pointer">
            <input type="checkbox" checked={cgvAccepted} onChange={(e) => setCgvAccepted(e.target.checked)} className="mt-0.5 w-4 h-4 accent-[#B23A24] flex-shrink-0" />
            <span className="text-xs text-[#3A3631]">
              J&rsquo;ai lu et j&rsquo;accepte les{" "}
              <a href="/legal" target="_blank" className="underline hover:text-[#B23A24]">conditions générales de vente</a>{" "}
              — commande avec obligation de paiement.
            </span>
          </label>
          <button type="submit" disabled={submitting} className="w-full bg-[#181614] text-white py-4 text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors disabled:opacity-50">
            {submitting ? "Redirection…" : `Payer ${fmt(total)} par carte`}
          </button>
        </form>
      </section>
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-6">
          <div className="bg-[#FAFAF8] max-w-sm w-full p-6">
            <h2 className="font-serif text-xl text-[#181614] mb-3">Annuler la commande ?</h2>
            {isLoggedIn ? (
              <>
                <p className="text-sm text-[#3A3631] mb-5">Ton panier est sauvegardé dans ton compte — tu pourras reprendre ta commande plus tard.</p>
                <div className="flex gap-3">
                  <button onClick={() => { setShowCancelModal(false); router.push("/"); }} className="flex-1 py-3 bg-[#181614] text-white text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors">Quitter et sauvegarder</button>
                  <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 border border-[#DEDAD1] text-sm text-[#3A3631] hover:border-[#181614] transition-colors">Continuer</button>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-[#3A3631] mb-2">Tu n&rsquo;as pas de compte — si tu quittes maintenant, ton panier sera perdu.</p>
                <p className="text-sm text-[#8C8780] mb-5">Crée un compte gratuit pour sauvegarder ta commande.</p>
                <div className="flex flex-col gap-2">
                  <button onClick={() => { setShowCancelModal(false); router.push("/compte/inscription?redirect=/commande"); }} className="w-full py-3 bg-[#181614] text-white text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors">Créer un compte et sauvegarder</button>
                  <button onClick={() => setShowCancelModal(false)} className="w-full py-3 border border-[#DEDAD1] text-sm text-[#3A3631] hover:border-[#181614] transition-colors">Continuer ma commande</button>
                  <button onClick={() => { clear(); setShowCancelModal(false); router.push("/"); }} className="w-full py-2 text-xs text-[#8C8780] hover:text-[#B23A24] transition-colors">Non merci, vider le panier et quitter</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
