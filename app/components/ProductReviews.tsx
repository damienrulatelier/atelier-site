"use client";

import { useEffect, useState } from "react";

type Review = {
  rating: number;
  comment: string;
  customerName: string;
  submittedAt?: string;
};

function fmtDate(iso?: string) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default function ProductReviews({ productTitle }: { productTitle: string }) {
  const [reviews, setReviews] = useState<Review[] | null>(null);

  useEffect(() => {
    fetch(`/api/reviews/product?title=${encodeURIComponent(productTitle)}`)
      .then((res) => res.json())
      .then((data) => setReviews(data.reviews || []));
  }, [productTitle]);

  if (!reviews || reviews.length === 0) return null;

  const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="mt-10 pt-8 border-t border-[#DEDAD1]">
      <div className="flex items-center gap-3 mb-6">
        <span className="text-[#B23A24] text-lg">{"★".repeat(Math.round(average))}{"☆".repeat(5 - Math.round(average))}</span>
        <span className="text-sm text-[#8C8780]">
          {average.toFixed(1)}/5 · {reviews.length} avis client{reviews.length > 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-col gap-5">
        {reviews.map((review, i) => (
          <div key={i} className="border-l-2 border-[#DEDAD1] pl-4">
            <div className="flex items-baseline gap-3 mb-1 flex-wrap">
              <span className="text-[#B23A24] text-sm">
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </span>
              <span className="text-xs text-[#8C8780]">
                {review.customerName} · {fmtDate(review.submittedAt)}
              </span>
            </div>
            {review.comment && <p className="text-[14.5px] text-[#3A3631]">{review.comment}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
