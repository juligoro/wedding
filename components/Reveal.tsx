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
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setVisible(true);
      return undefined;
    }

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
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
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
