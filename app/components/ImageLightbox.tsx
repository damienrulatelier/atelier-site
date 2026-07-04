"use client";

import { useState } from "react";

export default function ImageLightbox({
  images,
  title,
  onClose,
}: {
  images: string[];
  title: string;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const hasMultiple = images.length > 1;

  function prev(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => (i - 1 + images.length) % images.length);
  }
  function next(e: React.MouseEvent) {
    e.stopPropagation();
    setIndex((i) => (i + 1) % images.length);
  }

  return (
    <div
      className="fixed inset-0 z-[70] bg-[#181614]/90 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        aria-label="Fermer"
        className="absolute top-6 right-6 text-3xl text-white/80 hover:text-white leading-none"
      >
        ×
      </button>

      <div className="max-w-4xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-[#0000] flex items-center justify-center">
          {hasMultiple && (
            <button
              onClick={prev}
              aria-label="Photo précédente"
              className="absolute left-2 z-10 text-3xl text-white/70 hover:text-white px-3 py-2"
            >
              ‹
            </button>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[index]}
            alt={`${title} — photo ${index + 1}`}
            className="max-h-[80vh] max-w-full object-contain"
          />
          {hasMultiple && (
            <button
              onClick={next}
              aria-label="Photo suivante"
              className="absolute right-2 z-10 text-3xl text-white/70 hover:text-white px-3 py-2"
            >
              ›
            </button>
          )}
        </div>
        {hasMultiple && (
          <div className="flex justify-center gap-2 mt-4">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={(e) => {
                  e.stopPropagation();
                  setIndex(i);
                }}
                aria-label={`Voir la photo ${i + 1}`}
                className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/30"}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
