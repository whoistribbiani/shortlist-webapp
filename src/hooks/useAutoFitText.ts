import type { CSSProperties, RefObject } from "react";
import { useEffect, useMemo, useState } from "react";

import { computeAutoFitFontSize } from "../lib/autoFit";

interface UseAutoFitOptions {
  minFontSize?: number;
  maxFontSize?: number;
}

function parsePx(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textWidthForElement(element: HTMLElement, text: string, fontSize: number): number {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return text.length * fontSize;
  }
  const styles = getComputedStyle(element);
  context.font = `${styles.fontWeight} ${fontSize}px ${styles.fontFamily}`;
  const letterSpacing = parsePx(styles.letterSpacing);
  const spacingWidth = letterSpacing > 0 ? letterSpacing * Math.max(text.length - 1, 0) : 0;
  return context.measureText(text).width + spacingWidth;
}

export function useAutoFitText<T extends HTMLElement>(
  ref: RefObject<T | null>,
  text: string,
  options: UseAutoFitOptions = {}
): CSSProperties {
  const minFontSize = options.minFontSize ?? 10;
  const maxFontSize = options.maxFontSize ?? 16;
  const [fontSize, setFontSize] = useState(maxFontSize);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const recalc = () => {
      const styles = getComputedStyle(element);
      const horizontalPadding = parsePx(styles.paddingLeft) + parsePx(styles.paddingRight);
      const availableWidth = Math.max(0, element.clientWidth - horizontalPadding - 1);
      const next = computeAutoFitFontSize({
        availableWidth,
        text,
        minFontSize,
        maxFontSize,
        measure: (size) => textWidthForElement(element, text, size)
      });
      setFontSize((prev) => (prev === next ? prev : next));
    };

    const handle = requestAnimationFrame(recalc);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            recalc();
          })
        : null;
    observer?.observe(element);

    window.addEventListener("resize", recalc);
    return () => {
      cancelAnimationFrame(handle);
      observer?.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [ref, text, minFontSize, maxFontSize]);

  return useMemo(
    () => ({
      fontSize: `${fontSize}px`
    }),
    [fontSize]
  );
}
