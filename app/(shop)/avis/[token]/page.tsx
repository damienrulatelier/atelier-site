"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function AvisPage() {
  const params = useParams();
  const token = params.token as string;

  const [productTitle, setProductTitle] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [invalid, setInvalid] = useState(false);

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/reviews/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setProductTitle(data.productTitle);
        setAlreadySubmitted(data.alreadySubmitted);
      })
      .catch(() => setInvalid(true))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (rating === 0) {
      setError("Choisis une note avant d'envoyer.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/reviews/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Une erreur est survenue.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <main className="py-24 text-center text-sm text-[#8C8780]">Chargement…</main>;
  }

  if (invalid) {
    return (
      <main className="max-w-md mx-auto px-8 py-24 text-center">
        <p className="text-[#8C8780]">Ce lien d&rsquo;avis n&rsquo;est plus valide.</p>
      </main>
    );
  }

  if (alreadySubmitted || done) {
    return (
      <main className="max-w-md mx-auto px-8 py-24 text-center">
        <div className="text-4xl mb-6 text-[#B23A24]">✓</div>
        <h1 className="font-serif text-2xl text-[#181614] mb-3">Merci pour ton avis !</h1>
        <p className="text-sm text-[#8C8780]">
          Il sera publié sur le site une fois validé par l&rsquo;atelier.
        </p>
      </main>
    );
  }

  return (
    <main className="max-w-md mx-auto px-6 md:px-8 py-16">
      <h1 className="font-serif text-[26px] text-[#181614] mb-2 text-center">
        Ton avis sur «&nbsp;{productTitle}&nbsp;»
      </h1>
      <p className="text-sm text-[#8C8780] text-center mb-8">
        Quelques mots suffisent — merci de prendre le temps !
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              onMouseEnter={() => setHoverRating(n)}
              onMouseLeave={() => setHoverRating(0)}
              aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
              className="text-4xl leading-none transition-colors"
              style={{ color: n <= (hoverRating || rating) ? "#B23A24" : "#DEDAD1" }}
            >
              ★
            </button>
          ))}
        </div>

        <div>
          <label className="block text-xs uppercase tracking-wide font-semibold text-[#3A3631] mb-2">
            Ton commentaire (facultatif)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={5}
            maxLength={1000}
            placeholder="Ce que tu as pensé de l'œuvre, de la qualité, du délai..."
            className="w-full border border-[#DEDAD1] px-3 py-2.5 text-sm focus:outline-none focus:border-[#181614] resize-none"
          />
        </div>

        {error && <p className="text-sm text-[#B23A24]">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-3.5 text-sm uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors disabled:opacity-50"
        >
          {submitting ? "Envoi…" : "Envoyer mon avis"}
        </button>
      </form>
    </main>
  );
}
