"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DeliveryOptions, SizeKey } from "@/lib/products-types";
import { ALL_SIZES, emptyDeliveryOptions } from "@/lib/products-types";
export type ProductFormValues = {
  id?: string;
  title: string;
  type: "print" | "original" | "bd" | "autre";
  medium: string;
  size: string;
  edition: string;
  price: number;
  description: string;
  images: string[];
  imagesOriginal: string[];
  imagesPrint: string[];
  photoTags: Record<string, "original" | "print">;
  allowDedication: boolean;
  active: boolean;
  featured: boolean;
  wallPreviewEnabled: boolean;
  delivery: DeliveryOptions;
  linkedProductId: string;
  temporaryUntil: string;
  retireAt: string;
  editionTotal: number;
  editionSold: number;
};

const EMPTY: ProductFormValues = {
  title: "",
  type: "print",
  medium: "",
  size: "",
  edition: "",
  price: 0,
  description: "",
  images: [],
  imagesOriginal: [],
  imagesPrint: [],
  photoTags: {},
  allowDedication: false,
  active: true,
  featured: false,
  wallPreviewEnabled: false,
  delivery: emptyDeliveryOptions(),
  linkedProductId: "",
  temporaryUntil: "",
  retireAt: "",
  editionTotal: 0,
  editionSold: 0,
};

// Modes avec tailles (prix par format)
const SIZE_MODES = ["print", "canvas", "printEmail", "originalPrint", "originalPrintEmail"] as const;
type SizeMode = typeof SIZE_MODES[number];
// Modes avec prix unique
const FLAT_MODES = ["email", "original", "originalEmail"] as const;
type FlatMode = typeof FLAT_MODES[number];

const MODE_LABELS: Record<keyof DeliveryOptions, string> = {
  email:              "Fichier numérique seul (par e-mail)",
  print:              "Print seul (tirage papier, expédié)",
  canvas:             "Version toile (montée sur châssis, expédiée)",
  original:           "Œuvre originale seule (expédiée)",
  printEmail:         "Print + fichier numérique par e-mail",
  originalEmail:      "Original + fichier numérique par e-mail",
  originalPrint:      "Original + print (les deux physiques)",
  originalPrintEmail: "Original + print + fichier numérique",
};

const SIZE_LABELS: Record<SizeKey, string> = {
  A6: "A6 (10,5×14,8 cm)",
  A5: "A5 (14,8×21 cm)",
  A4: "A4 (21×29,7 cm)",
  A3: "A3 (29,7×42 cm)",
  A2: "A2 (42×59,4 cm)",
  A1: "A1 (59,4×84,1 cm)",
  A0: "A0 (84,1×118,9 cm)",
};

export default function ProductForm({
  initialValues,
  mode,
}: {
  initialValues?: Partial<ProductFormValues>;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Récupérer l'image rognée si on revient de la page /admin/rogner
  useEffect(() => {
    const croppedImage = searchParams.get("croppedImage");
    const replacedImage = searchParams.get("replacedImage");
    if (croppedImage) {
      setValues(prev => {
        const newImages = replacedImage
          ? prev.images.map(img => img === replacedImage ? croppedImage : img)
          : [...prev.images, croppedImage];
        return { ...prev, images: newImages };
      });
      // Nettoyer les query params
      router.replace(window.location.pathname);
    }
  }, [searchParams, router]);
  const [values, setValues] = useState<ProductFormValues>({
    ...EMPTY,
    ...initialValues,
    delivery: initialValues?.delivery ?? emptyDeliveryOptions(),
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function set<K extends keyof ProductFormValues>(key: K, val: ProductFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  // Helpers delivery
  function setFlatMode(modeKey: FlatMode, field: "enabled" | "price", val: boolean | number) {
    setValues((v) => ({
      ...v,
      delivery: {
        ...v.delivery,
        [modeKey]: { ...v.delivery[modeKey], [field]: val },
      },
    }));
  }

  function setSizeMode(modeKey: SizeMode, field: "enabled", val: boolean) {
    setValues((v) => ({
      ...v,
      delivery: {
        ...v.delivery,
        [modeKey]: { ...v.delivery[modeKey], [field]: val },
      },
    }));
  }

  function setSizePrice(modeKey: SizeMode, sizeKey: SizeKey, field: "enabled" | "price", val: boolean | number) {
    setValues((v) => ({
      ...v,
      delivery: {
        ...v.delivery,
        [modeKey]: {
          ...v.delivery[modeKey],
          sizes: {
            ...(v.delivery[modeKey] as { enabled: boolean; sizes: DeliveryOptions["print"]["sizes"] }).sizes,
            [sizeKey]: {
              ...(v.delivery[modeKey] as { enabled: boolean; sizes: DeliveryOptions["print"]["sizes"] }).sizes[sizeKey],
              [field]: val,
            },
          },
        },
      },
    }));
  }

  async function handleImageUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    const newUrls: string[] = [];
    try {
      const sigRes = await fetch("/api/admin/upload", { method: "GET" });
      if (!sigRes.ok) throw new Error("Erreur signature: " + sigRes.status);
      const sig = await sigRes.json();
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file as Blob);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const res = await fetch(
          `https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`,
          { method: "POST", body: fd }
        );
        const data = await res.json();
        if (data.secure_url) newUrls.push(data.secure_url);
        else alert("Erreur Cloudinary: " + JSON.stringify(data.error || data));
      }
    } catch (e) { alert("Erreur: " + String(e)); }
    if (newUrls.length > 0) setValues(prev => ({ ...prev, images: [...prev.images, ...newUrls] }));
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const url = mode === "create" ? "/api/admin/products" : `/api/admin/products/${values.id}`;
      const method = mode === "create" ? "POST" : "PATCH";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          linkedProductId: values.linkedProductId || undefined,
          temporaryUntil: values.temporaryUntil || undefined,
          retireAt: values.retireAt || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur inconnue");
        setSaving(false);
        return;
      }
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur réseau — vérifie ta connexion.");
      setSaving(false);
    }
  }

  const inputCls = "w-full border border-[#DEDAD1] px-2.5 py-2 text-sm focus:outline-none focus:border-[#181614]";
  const labelCls = "block text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-2";

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-6 md:px-8 py-10 flex flex-col gap-8">

      {/* Infos de base */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[18px] text-[#181614] border-b border-[#DEDAD1] pb-2">Informations générales</h2>
        <div>
          <label className={labelCls}>Titre *</label>
          <input className={inputCls} value={values.title} onChange={(e) => set("title", e.target.value)} required />
        </div>
        <div>
          <label className={labelCls}>Type de produit</label>
          <select className={inputCls} value={values.type} onChange={(e) => set("type", e.target.value as ProductFormValues["type"])}>
            <option value="print">Print (édition limitée numérotée)</option>
            <option value="original">Œuvre originale (pièce unique)</option>
            <option value="bd">Bande dessinée</option>
            <option value="drop">Drop (disponible durée limitée)</option>
            <option value="autre">Autre</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Médium / technique</label>
            <input className={inputCls} value={values.medium} onChange={(e) => set("medium", e.target.value)} placeholder="Encre sur papier…" />
          </div>
          <div>
            <label className={labelCls}>Dimensions</label>
            <input className={inputCls} value={values.size} onChange={(e) => set("size", e.target.value)} placeholder="21 × 29,7 cm" />
          </div>
        </div>
        {(values.type === "print") && (
          <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>{"N° d'édition (affiché)"}</label>
              <input className={inputCls} value={values.edition} onChange={(e) => set("edition", e.target.value)} placeholder="1/20" />
            </div>
            <div>
              <label className={labelCls}>Total de l&apos;édition</label>
              <input type="number" min="0" className={inputCls} value={values.editionTotal || ""} onChange={(e) => set("editionTotal", parseInt(e.target.value) || 0)} placeholder="0 = pas de limite" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Exemplaires vendus</label>
              <p className="text-xs text-[#8C8780] mb-1">Mis à jour automatiquement à chaque vente</p>
              <input type="number" min="0" className={inputCls} value={values.editionSold || ""} onChange={(e) => set("editionSold", parseInt(e.target.value) || 0)} placeholder="0" />
            </div>
          </div>
          </>
        )}
        <div>
          <label className={labelCls}>Prix unique (BD / autre uniquement)</label>
          <input type="number" step="0.01" min="0" className={`${inputCls} max-w-[180px]`} value={values.price || ""} onChange={(e) => set("price", parseFloat(e.target.value) || 0)} placeholder="0.00 €" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea className={inputCls} rows={4} value={values.description} onChange={(e) => set("description", e.target.value)} />
        </div>
      </section>

      {/* Options de réception et prix — simplifié */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[18px] text-[#181614] border-b border-[#DEDAD1] pb-2">Options de réception et prix</h2>
        <p className="text-xs text-[#8C8780]">
          Coche ce que le client peut recevoir et mets le prix. Il pourra tout cocher en même temps — le total s&rsquo;additionnera.
        </p>

        {/* Email */}
        <div className={`border p-4 ${values.delivery.email.enabled ? "border-[#B23A24] bg-[#FAF8F5]" : "border-[#DEDAD1]"}`}>
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={values.delivery.email.enabled}
              onChange={e => setFlatMode("email", "enabled", e.target.checked)}
              className="w-4 h-4 accent-[#B23A24]" />
            <span className="text-sm font-medium">Fichier numérique (par e-mail)</span>
          </label>
          {values.delivery.email.enabled && (
            <div className="ml-7">
              <label className="block text-xs text-[#8C8780] mb-1">Prix (€)</label>
              <input type="number" step="0.01" min="0" className={`${inputCls} max-w-[160px]`}
                value={values.delivery.email.price || ""}
                onChange={e => setFlatMode("email", "price", parseFloat(e.target.value) || 0)}
                placeholder="0.00" />
            </div>
          )}
        </div>

        {/* Prints par format */}
        <div className={`border p-4 ${values.delivery.print.enabled ? "border-[#B23A24] bg-[#FAF8F5]" : "border-[#DEDAD1]"}`}>
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={values.delivery.print.enabled}
              onChange={e => setSizeMode("print", "enabled", e.target.checked)}
              className="w-4 h-4 accent-[#B23A24]" />
            <span className="text-sm font-medium">Prints (tirages papier, expédiés)</span>
          </label>
          {values.delivery.print.enabled && (
            <div className="ml-7 grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_SIZES.map(s => {
                const sizeData = values.delivery.print.sizes[s];
                return (
                  <div key={s} className={`border p-2 ${sizeData.enabled ? "border-[#181614] bg-white" : "border-[#DEDAD1]"}`}>
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input type="checkbox" checked={sizeData.enabled}
                        onChange={e => setSizePrice("print", s, "enabled", e.target.checked)}
                        className="accent-[#B23A24]" />
                      <span className="text-xs font-semibold">{SIZE_LABELS[s]}</span>
                    </label>
                    {sizeData.enabled && (
                      <input type="number" step="0.01" min="0"
                        className="w-full border border-[#DEDAD1] px-2 py-1 text-xs focus:outline-none focus:border-[#181614]"
                        value={sizeData.price || ""}
                        onChange={e => setSizePrice("print", s, "price", parseFloat(e.target.value) || 0)}
                        placeholder="Prix €" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Toile */}
        <div className={`border p-4 ${values.delivery.canvas?.enabled ? "border-[#B23A24] bg-[#FAF8F5]" : "border-[#DEDAD1]"}`}>
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={values.delivery.canvas?.enabled || false}
              onChange={e => setSizeMode("canvas" as SizeMode, "enabled", e.target.checked)}
              className="w-4 h-4 accent-[#B23A24]" />
            <span className="text-sm font-medium">Version toile (montée sur châssis, expédiée)</span>
          </label>
          {values.delivery.canvas?.enabled && (
            <div className="ml-7 grid grid-cols-2 md:grid-cols-3 gap-3">
              {ALL_SIZES.map(s => {
                const sizeData = values.delivery.canvas?.sizes[s] || { enabled: false, price: 0 };
                return (
                  <div key={s} className={`border p-2 ${sizeData.enabled ? "border-[#181614] bg-white" : "border-[#DEDAD1]"}`}>
                    <label className="flex items-center gap-2 cursor-pointer mb-1">
                      <input type="checkbox" checked={sizeData.enabled}
                        onChange={e => setSizePrice("canvas" as SizeMode, s, "enabled", e.target.checked)}
                        className="accent-[#B23A24]" />
                      <span className="text-xs font-semibold">{SIZE_LABELS[s]}</span>
                    </label>
                    {sizeData.enabled && (
                      <input type="number" step="0.01" min="0"
                        className="w-full border border-[#DEDAD1] px-2 py-1 text-xs focus:outline-none focus:border-[#181614]"
                        value={sizeData.price || ""}
                        onChange={e => setSizePrice("canvas" as SizeMode, s, "price", parseFloat(e.target.value) || 0)}
                        placeholder="Prix €" />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <div className={`border p-4 ${values.delivery.original.enabled ? "border-[#B23A24] bg-[#FAF8F5]" : "border-[#DEDAD1]"}`}>
          <label className="flex items-center gap-3 cursor-pointer mb-3">
            <input type="checkbox" checked={values.delivery.original.enabled}
              onChange={e => setFlatMode("original", "enabled", e.target.checked)}
              className="w-4 h-4 accent-[#B23A24]" />
            <span className="text-sm font-medium text-[#B23A24] font-semibold">✦ Œuvre originale (pièce unique, expédiée)</span>
          </label>
          {values.delivery.original.enabled && (
            <div className="ml-7">
              <label className="block text-xs text-[#8C8780] mb-1">Prix (€)</label>
              <input type="number" step="0.01" min="0" className={`${inputCls} max-w-[160px]`}
                value={values.delivery.original.price || ""}
                onChange={e => setFlatMode("original", "price", parseFloat(e.target.value) || 0)}
                placeholder="0.00" />
            </div>
          )}
        </div>
      </section>

      {/* Durée de vie */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[18px] text-[#181614] border-b border-[#DEDAD1] pb-2">Durée de vie</h2>
        <div>
          <label className={labelCls}>Drop — expiration automatique (laisse vide si ce n&rsquo;est pas un drop)</label>
          <input type="datetime-local" className={inputCls}
            value={values.temporaryUntil ? values.temporaryUntil.slice(0, 16) : ""}
            onChange={e => set("temporaryUntil", e.target.value ? new Date(e.target.value).toISOString() : "")} />
        </div>
        <div>
          <label className={labelCls}>
            Retrait définitif du catalogue{" "}
            <span className="text-[#B23A24] font-normal normal-case">— affiche "Dernière chance" au client jusqu&rsquo;à cette date, puis le produit disparaît</span>
          </label>
          <input type="datetime-local" className={inputCls}
            value={values.retireAt ? (values.retireAt as string).slice(0, 16) : ""}
            onChange={e => setValues(prev => ({ ...prev, retireAt: e.target.value ? new Date(e.target.value).toISOString() : "" }))} />
        </div>
      </section>

      {/* Photos */}
      <section className="flex flex-col gap-4">
        <h2 className="font-serif text-[18px] text-[#181614] border-b border-[#DEDAD1] pb-2">Photos</h2>

        {/* Si le produit a original ET print — deux sections séparées */}
        {values.delivery.original?.enabled ? (
          <>
            <div className="border border-[#B23A24] p-4 bg-[#FAF8F5]">
              <p className="text-sm font-semibold text-[#B23A24] mb-2">✦ Photo de l&rsquo;œuvre originale</p>
              <p className="text-xs text-[#8C8780] mb-3">Photo pour montrer la pièce unique — texture, détails à la main, etc.</p>
              <input type="file" accept="image/*" multiple onChange={async (e) => {
                if (!e.target.files?.length) return;
                setUploading(true);
                for (const file of Array.from(e.target.files)) {
                  try {
                    const sigRes = await fetch("/api/admin/upload", { method: "GET" });
                    const sigData = await sigRes.json();
                    if (sigData.cloudName) {
                      const fd = new FormData();
                      fd.append("file", file as Blob);
                      fd.append("api_key", sigData.apiKey);
                      fd.append("timestamp", String(sigData.timestamp));
                      fd.append("signature", sigData.signature);
                      fd.append("folder", sigData.folder);
                      const res = await fetch(`https://api.cloudinary.com/v1_1/${sigData.cloudName}/image/upload`, { method: "POST", body: fd });
                      const data = await res.json();
                      if (data.secure_url) setValues(prev => ({ ...prev, imagesOriginal: [...(prev.imagesOriginal || []), data.secure_url] }));
                    }
                  } catch { /* silencieux */ }
                }
                setUploading(false);
              }} className="text-sm text-[#8C8780]" />
              {(values.imagesOriginal || []).length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {(values.imagesOriginal || []).map((img, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-20 h-20 object-cover border border-[#DEDAD1]" />
                      <button type="button" onClick={() => { const returnTo = window.location.pathname + window.location.search; router.push(`/admin/rogner?image=${encodeURIComponent(img)}&returnTo=${encodeURIComponent(returnTo)}`); }} className="absolute bottom-0 left-0 w-full text-[9px] bg-[#181614] text-white py-0.5 text-center hover:bg-[#B23A24]">Rogner</button>
                      <button type="button" onClick={() => setValues(prev => ({ ...prev, imagesOriginal: (prev.imagesOriginal || []).filter((_, j) => j !== i) }))} className="absolute top-0 right-0 w-5 h-5 bg-[#B23A24] text-white text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border border-[#DEDAD1] p-4">
              <p className="text-sm font-semibold text-[#181614] mb-2">Photos du produit (prints, toile…)</p>
              <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} className="text-sm text-[#8C8780]" />
              {values.images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {values.images.map((img, i) => (
                    <div key={i} className="relative">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img} alt="" className="w-20 h-20 object-cover border border-[#DEDAD1]" />
                      <button type="button" onClick={() => { const returnTo = window.location.pathname + window.location.search; router.push(`/admin/rogner?image=${encodeURIComponent(img)}&returnTo=${encodeURIComponent(returnTo)}`); }} className="absolute bottom-0 left-0 w-full text-[9px] bg-[#181614] text-white py-0.5 text-center hover:bg-[#B23A24]">Rogner</button>
                      <button type="button" onClick={() => set("images", values.images.filter((_, j) => j !== i))} className="absolute top-0 right-0 w-5 h-5 bg-[#B23A24] text-white text-xs flex items-center justify-center">×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Section photo unique si pas les deux */
          <>
            <input type="file" accept="image/*" multiple onChange={(e) => handleImageUpload(e.target.files)} className="text-sm text-[#8C8780]" />
            {values.images.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {values.images.map((img, i) => (
                  <div key={i} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img} alt="" className="w-20 h-20 object-cover border border-[#DEDAD1]" />
                    <button
                      type="button"
                      onClick={() => {
                        const returnTo = window.location.pathname + window.location.search;
                        router.push(`/admin/rogner?image=${encodeURIComponent(img)}&returnTo=${encodeURIComponent(returnTo)}`);
                      }}
                      className="absolute bottom-0 left-0 w-full text-[9px] bg-[#181614] text-white py-0.5 text-center hover:bg-[#B23A24]"
                    >
                      Rogner
                    </button>
                    <button type="button" onClick={() => set("images", values.images.filter((_, j) => j !== i))} className="absolute top-0 right-0 w-5 h-5 bg-[#B23A24] text-white text-xs flex items-center justify-center">×</button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {uploading && <p className="text-sm text-[#8C8780]">Envoi en cours…</p>}
      </section>

      {/* Options */}
      <section className="flex flex-col gap-3">
        <h2 className="font-serif text-[18px] text-[#181614] border-b border-[#DEDAD1] pb-2">Options d'affichage</h2>
        {[
          { key: "active", label: "Produit visible sur le site" },
          { key: "featured", label: "Mis en avant sur la page d'accueil" },
          { key: "allowDedication", label: "Proposer une dédicace (gratuit)" },
          { key: "wallPreviewEnabled", label: "Aperçu « Voir sur un mur »" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={values[key as keyof ProductFormValues] as boolean} onChange={(e) => set(key as keyof ProductFormValues, e.target.checked as never)} className="accent-[#B23A24]" />
            {label}
          </label>
        ))}
      </section>

      {error && <p className="text-sm text-[#B23A24]">{error}</p>}

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="px-8 py-3.5 bg-[#181614] text-white text-sm uppercase tracking-wide font-semibold hover:bg-[#B23A24] transition-colors disabled:opacity-50">
          {saving ? "Enregistrement…" : mode === "create" ? "Créer le produit" : "Enregistrer"}
        </button>
        <button type="button" onClick={() => router.back()} className="px-6 py-3.5 border border-[#DEDAD1] text-sm text-[#3A3631] hover:border-[#181614] transition-colors">
          Annuler
        </button>
      </div>
    </form>
  );
}
