"use client";

import { useEffect, useState } from "react";
import { getSessionToken } from "./sessionToken";

export default function EditionNumberBadge({
  productId,
  editionTotal,
}: {
  productId: string;
  editionTotal: number;
}) {
  const [number, setNumber] = useState<number | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [soldOut, setSoldOut] = useState(false);

  useEffect(() => {
    if (!editionTotal) return;
    const token = getSessionToken();
    if (!token) return;

    let cancelled = false;

    fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, sessionToken: token }),
    })
      .then((res) => {
        if (res.status === 409) {
          setSoldOut(true);
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data) setNumber(data.number);
      })
      .catch(() => {});

    fetch(`/api/reservations?productId=${productId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setRemaining(data.remaining);
      })
      .catch(() => {});

    // Libère la réservation si le visiteur quitte la page sans acheter.
    // sendBeacon fonctionne même pendant la fermeture de l'onglet, contrairement à fetch.
    function releaseOnLeave() {
      const payload = JSON.stringify({ productId, sessionToken: token });
      navigator.sendBeacon?.(
        "/api/reservations/release-beacon",
        new Blob([payload], { type: "application/json" })
      );
    }
    window.addEventListener("pagehide", releaseOnLeave);

    return () => {
      cancelled = true;
      window.removeEventListener("pagehide", releaseOnLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, editionTotal]);

  if (!editionTotal) return null;

  if (soldOut) {
    return (
      <div className="inline-flex items-center gap-2 bg-[#F2F0EA] border border-[#DEDAD1] px-3 py-2 text-xs text-[#8C8780]">
        Édition complète — tous les exemplaires sont vendus.
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-2 bg-[#F2F0EA] border border-[#B23A24] px-3 py-2 text-xs text-[#3A3631]">
      {number ? (
        <>
          📌 Vous achèterez l&rsquo;exemplaire <strong>n°{number}</strong> sur {editionTotal}
          {remaining !== null && remaining <= 3 && (
            <span className="text-[#B23A24] font-medium">
              {" "}
              · plus que {remaining} disponible{remaining > 1 ? "s" : ""} !
            </span>
          )}
        </>
      ) : (
        "Vérification de la disponibilité…"
      )}
    </div>
  );
}
