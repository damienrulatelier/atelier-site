"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useState, useRef, useEffect, useCallback, Suspense } from "react";

function RognerContent() {
  const params = useSearchParams();
  const router = useRouter();
  const imageSrc = params.get("image") || "";
  const returnTo = params.get("returnTo") || "/admin/products";

  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgDims, setImgDims] = useState({ w: 0, h: 0 });
  const [box, setBox] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const dragRef = useRef<{ type: string; startX: number; startY: number; origBox: typeof box } | null>(null);

  useEffect(() => {
    if (!imgLoaded || !containerRef.current || !imgRef.current) return;
    const cw = containerRef.current.clientWidth;
    const ih = imgRef.current.clientHeight;
    setImgDims({ w: cw, h: ih });
    const pw = Math.round(cw * 0.8);
    const ph = Math.round(ih * 0.8);
    setBox({ x: Math.round((cw - pw) / 2), y: Math.round((ih - ph) / 2), w: pw, h: ph });
  }, [imgLoaded]);

  const clamp = (v: number, mn: number, mx: number) => Math.max(mn, Math.min(mx, v));

  const onPointerDown = useCallback((e: React.PointerEvent, type: string) => {
    e.preventDefault();
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { type, startX: e.clientX, startY: e.clientY, origBox: { ...box } };
  }, [box]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !imgDims.w) return;
    const drag = dragRef.current;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const ob = drag.origBox;
    const { w: iw, h: ih } = imgDims;
    const MIN = 30;
    const type = drag.type;
    setBox(() => {
      let { x, y, w, h } = ob;
      switch (type) {
        case "move": x = clamp(ob.x + dx, 0, iw - ob.w); y = clamp(ob.y + dy, 0, ih - ob.h); break;
        case "tl": x = clamp(ob.x + dx, 0, ob.x + ob.w - MIN); y = clamp(ob.y + dy, 0, ob.y + ob.h - MIN); w = ob.x + ob.w - x; h = ob.y + ob.h - y; break;
        case "tr": y = clamp(ob.y + dy, 0, ob.y + ob.h - MIN); w = clamp(ob.w + dx, MIN, iw - ob.x); h = ob.y + ob.h - y; break;
        case "bl": x = clamp(ob.x + dx, 0, ob.x + ob.w - MIN); w = ob.x + ob.w - x; h = clamp(ob.h + dy, MIN, ih - ob.y); break;
        case "br": w = clamp(ob.w + dx, MIN, iw - ob.x); h = clamp(ob.h + dy, MIN, ih - ob.y); break;
      }
      return { x, y, w, h };
    });
  }, [imgDims]);

  const onPointerUp = useCallback(() => { dragRef.current = null; }, []);

  async function confirmCrop() {
    const img = imgRef.current;
    if (!img || !imgDims.w) return;
    setLoading(true);
    setMsg("Rognage en cours…");
    const scaleX = img.naturalWidth / imgDims.w;
    const scaleY = img.naturalHeight / imgDims.h;
    try {
      const res = await fetch("/api/admin/crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imagePath: imageSrc,
          x: Math.round(box.x * scaleX),
          y: Math.round(box.y * scaleY),
          w: Math.round(box.w * scaleX),
          h: Math.round(box.h * scaleY),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMsg("✓ Rogné ! Retour au formulaire…");
      // Retourner au formulaire avec la nouvelle URL
      const separator = returnTo.includes("?") ? "&" : "?";
      router.push(`${returnTo}${separator}croppedImage=${encodeURIComponent(data.url)}&replacedImage=${encodeURIComponent(imageSrc)}`);
    } catch (err) {
      setMsg("Erreur : " + (err instanceof Error ? err.message : "inconnue"));
      setLoading(false);
    }
  }

  const H = 16;

  if (!imageSrc) return <div className="p-8 text-red-600">Pas d&apos;image à rogner.</div>;

  return (
    <div className="min-h-screen bg-[#FAFAF8] p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-[#181614]">Rogner l&apos;image</h1>
        <button onClick={() => router.back()} className="text-sm text-[#8C8780] hover:text-[#181614] border border-[#DEDAD1] px-4 py-2">
          ← Annuler
        </button>
      </div>

      <p className="text-sm text-[#8C8780] mb-4">Déplace ou redimensionne le cadre blanc, puis clique sur <strong>Rogner et utiliser</strong>.</p>

      <div
        ref={containerRef}
        className="relative w-full select-none"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          ref={imgRef}
          src={imageSrc}
          alt="À rogner"
          className="w-full h-auto block"
          draggable={false}
          onLoad={() => setImgLoaded(true)}
        />

        {imgLoaded && imgDims.w > 0 && (
          <>
            {/* Overlay sombre hors sélection */}
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", pointerEvents: "none" }} />
            {/* Zone claire sélectionnée */}
            <div style={{
              position: "absolute",
              left: box.x, top: box.y, width: box.w, height: box.h,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.5)",
              border: "2px solid white",
              pointerEvents: "none",
            }} />
            {/* Zone de déplacement */}
            <div
              style={{ position: "absolute", left: box.x, top: box.y, width: box.w, height: box.h, cursor: "move" }}
              onPointerDown={e => onPointerDown(e, "move")}
            />
            {/* Poignées */}
            {([
              { id: "tl", l: box.x - H/2, t: box.y - H/2 },
              { id: "tr", l: box.x + box.w - H/2, t: box.y - H/2 },
              { id: "bl", l: box.x - H/2, t: box.y + box.h - H/2 },
              { id: "br", l: box.x + box.w - H/2, t: box.y + box.h - H/2 },
            ] as const).map(({ id, l, t }) => (
              <div
                key={id}
                style={{ position: "absolute", left: l, top: t, width: H, height: H, background: "white", border: "2px solid #181614", cursor: "nwse-resize" }}
                onPointerDown={e => onPointerDown(e, id)}
              />
            ))}
          </>
        )}
      </div>

      {msg && <p className="mt-4 text-sm font-medium text-[#3A3631]">{msg}</p>}

      <div className="flex gap-3 mt-6">
        <button
          onClick={() => router.back()}
          className="px-6 py-3 border border-[#DEDAD1] text-sm text-[#3A3631] hover:border-[#181614]"
          disabled={loading}
        >
          Utiliser sans rogner
        </button>
        <button
          onClick={confirmCrop}
          disabled={!imgLoaded || loading}
          className="px-6 py-3 bg-[#181614] text-white text-sm hover:bg-[#B23A24] transition-colors disabled:opacity-50"
        >
          Rogner et utiliser
        </button>
      </div>
    </div>
  );
}

export default function RognerPage() {
  return (
    <Suspense>
      <RognerContent />
    </Suspense>
  );
}
