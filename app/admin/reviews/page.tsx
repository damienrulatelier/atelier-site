"use client";

import { useEffect, useState } from "react";

type Review = {
  id: string;
  productTitle: string;
  customerName: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  submittedAt?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[] | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  function load() {
    fetch("/api/admin/reviews")
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function moderate(id: string, status: "approved" | "rejected") {
    setUpdating(id);
    try {
      await fetch(`/api/admin/reviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      load();
    } finally {
      setUpdating(null);
    }
  }

  if (!reviews) {
    return <main className="py-24 text-center text-sm text-[#8C8780]">Chargement…</main>;
  }

  const pending = reviews.filter((r) => r.status === "pending");
  const others = reviews.filter((r) => r.status !== "pending");

  return (
    <main className="max-w-3xl mx-auto px-6 md:px-8 py-12">
      <h1 className="font-serif text-[26px] text-[#181614] mb-8">Avis clients</h1>

      <h2 className="text-sm uppercase tracking-wide font-semibold text-[#B23A24] mb-4">
        En attente de validation ({pending.length})
      </h2>
      {pending.length === 0 ? (
        <p className="text-sm text-[#8C8780] mb-10">Rien à valider pour l&rsquo;instant.</p>
      ) : (
        <div className="flex flex-col gap-4 mb-10">
          {pending.map((review) => (
            <div key={review.id} className="border border-[#DEDAD1] p-5">
              <div className="flex justify-between items-baseline mb-2 flex-wrap gap-2">
                <span className="font-serif text-[16px] text-[#181614]">{review.productTitle}</span>
                <span className="text-[#B23A24]">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
              </div>
              <p className="text-xs text-[#8C8780] mb-3">
                {review.customerName} · {fmtDate(review.submittedAt)}
              </p>
              {review.comment && <p className="text-sm text-[#3A3631] mb-4">{review.comment}</p>}
              <div className="flex gap-3">
                <button
                  onClick={() => moderate(review.id, "approved")}
                  disabled={updating === review.id}
                  className="px-4 py-2 text-xs uppercase tracking-wide font-semibold bg-[#181614] text-white hover:bg-[#B23A24] transition-colors disabled:opacity-50"
                >
                  Publier
                </button>
                <button
                  onClick={() => moderate(review.id, "rejected")}
                  disabled={updating === review.id}
                  className="px-4 py-2 text-xs uppercase tracking-wide font-semibold border border-[#DEDAD1] text-[#3A3631] hover:border-[#181614] transition-colors disabled:opacity-50"
                >
                  Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <h2 className="text-sm uppercase tracking-wide font-semibold text-[#3A3631] mb-4">
        Déjà traités
      </h2>
      {others.length === 0 ? (
        <p className="text-sm text-[#8C8780]">Aucun avis traité pour l&rsquo;instant.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {others.map((review) => (
            <div key={review.id} className="border border-[#DEDAD1] p-4 flex justify-between items-baseline gap-3 flex-wrap">
              <span className="text-sm text-[#3A3631]">
                {review.productTitle} — {review.customerName}
              </span>
              <span
                className={`text-xs uppercase tracking-wide font-medium ${
                  review.status === "approved" ? "text-[#3A7D44]" : "text-[#8C8780]"
                }`}
              >
                {review.status === "approved" ? "Publié" : "Refusé"}
              </span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
