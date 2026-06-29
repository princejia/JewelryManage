"use client";

import { useState } from "react";

export function Gallery({ images, title }: { images: string[]; title: string }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState(false);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square w-full items-center justify-center bg-gradient-to-br from-amber-100 to-rose-100 text-7xl">
        💎
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setZoom(true)}
        className="aspect-square w-full cursor-zoom-in bg-gradient-to-br from-amber-100 to-rose-100"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={title}
          className="h-full w-full object-cover"
        />
      </button>

      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto px-4 pt-4">
          {images.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition ${
                i === active ? "border-amber-400" : "border-transparent opacity-70"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {zoom && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setZoom(false)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[active]}
            alt={title}
            className="max-h-full max-w-full cursor-zoom-out object-contain"
          />
          {images.length > 1 && (
            <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-2">
              {images.map((url, i) => (
                <button
                  key={url}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActive(i);
                  }}
                  className={`h-2.5 w-2.5 rounded-full ${
                    i === active ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}
