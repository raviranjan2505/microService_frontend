"use client";

import { useEffect } from "react";

type UseInfiniteWindowScrollOptions = {
  enabled: boolean;
  onLoadMore: () => void;
  offset?: number;
};

export function useInfiniteWindowScroll({
  enabled,
  onLoadMore,
  offset = 300,
}: UseInfiniteWindowScrollOptions) {
  useEffect(() => {
    if (!enabled) return;

    let ticking = false;

    const handleScroll = () => {
      if (ticking) return;

      ticking = true;
      window.requestAnimationFrame(() => {
        const scrollPosition = window.innerHeight + window.scrollY;
        const totalHeight = document.documentElement.scrollHeight;

        if (scrollPosition >= totalHeight - offset) {
          onLoadMore();
        }

        ticking = false;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [enabled, offset, onLoadMore]);
}
