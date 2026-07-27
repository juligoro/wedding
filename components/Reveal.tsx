"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties, ElementType, ReactNode } from "react";

interface RevealProps {
  as?: ElementType;
  className?: string;
  variant?: string;
  delay?: number;
  once?: boolean;
  children?: ReactNode;
  [key: string]: unknown;
}

/**
 * Scroll-triggered entrance animation. Adds `is-visible` once the element
 * enters the viewport. Honours prefers-reduced-motion (shows immediately).
 */
export default function Reveal({
  as: Tag = "div",
  className = "",
  variant = "up",
  delay = 0,
  once = true,
  children,
  ...rest
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        typeof IntersectionObserver === "undefined")
    ) {
      setVisible(true);
      return undefined;
    }

    // Never let the entrance animation hide content that's about to fill the
    // screen. A block at least as tall as the viewport (e.g. the RSVP form on a
    // phone) can't reliably satisfy a ratio-based observer and is content the
    // user must always see — reveal it right away, no observer needed.
    if (el.offsetHeight >= window.innerHeight) {
      setVisible(true);
      return undefined;
    }

    // Reveal as soon as the element enters the viewport (threshold 0). A prior
    // 0.15 threshold silently broke on elements taller than ~6.5× the viewport
    // — 15% of them can never be on screen at once, so the observer never fired
    // and they stayed at opacity 0. The negative bottom rootMargin keeps the
    // "reveal a touch after it scrolls in" feel for normal-height elements.
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setVisible(false);
          }
        });
      },
      { threshold: 0, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  // Polymorphic `as`: render through a permissive props bag so the ref and any
  // passthrough props type-check regardless of which tag is used.
  const Component = Tag as ElementType;
  const style: CSSProperties | undefined = delay ? { transitionDelay: `${delay}ms` } : undefined;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tagProps: any = {
    ref,
    className: `reveal reveal-${variant} ${visible ? "is-visible" : ""} ${className}`.trim(),
    style,
    ...rest,
  };

  return <Component {...tagProps}>{children}</Component>;
}
