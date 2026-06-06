"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const AUTOPLAY_MS = 2600;

export default function PhotoGallery({ photos, labels }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = photos.length;
  const timer = useRef(null);

  const go = useCallback(
    (next) => setIndex((current) => (next + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return undefined;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return undefined;
    }

    timer.current = window.setTimeout(() => go(index + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer.current);
  }, [index, paused, count, go]);

  return (
    <div
      className="gallery"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="gallery-frame">
        <div className="gallery-stage" aria-roledescription="carousel">
          {photos.map((photo, i) => (
            <figure
              className={`gallery-slide ${i === index ? "is-active" : ""}`}
              key={photo.src}
              aria-hidden={i !== index}
            >
              <img
                src={photo.src}
                alt={photo.alt}
                loading={i === 0 ? "eager" : "lazy"}
                style={{ objectPosition: photo.position }}
              />
            </figure>
          ))}

          <button
            type="button"
            className="gallery-arrow prev"
            onClick={() => go(index - 1)}
            aria-label={labels.prev}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 5 L8 12 L15 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            className="gallery-arrow next"
            onClick={() => go(index + 1)}
            aria-label={labels.next}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5 L16 12 L9 19" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="gallery-caption">
          <img className="gallery-mark" src="/logo-juli-tomi-cropped.svg" alt="" aria-hidden="true" />
        </div>
      </div>

      <div className="gallery-dots" role="tablist" aria-label={labels.label}>
        {photos.map((photo, i) => (
          <button
            type="button"
            key={photo.src}
            className={`gallery-dot ${i === index ? "is-active" : ""}`}
            onClick={() => setIndex(i)}
            aria-label={`${labels.go} ${i + 1}`}
            aria-selected={i === index}
            role="tab"
          />
        ))}
      </div>
    </div>
  );
}
