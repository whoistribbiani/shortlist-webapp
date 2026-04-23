export interface AutoFitInput {
  availableWidth: number;
  text: string;
  minFontSize: number;
  maxFontSize: number;
  measure: (fontSize: number) => number;
}

export function computeAutoFitFontSize({
  availableWidth,
  text,
  minFontSize,
  maxFontSize,
  measure
}: AutoFitInput): number {
  const min = Math.max(1, Math.floor(minFontSize));
  const max = Math.max(min, Math.floor(maxFontSize));
  const value = text.trim();

  if (!value) {
    return max;
  }
  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return min;
  }
  if (measure(max) <= availableWidth) {
    return max;
  }
  if (measure(min) > availableWidth) {
    return min;
  }

  let lo = min;
  let hi = max;
  let best = min;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const width = measure(mid);
    if (width <= availableWidth) {
      best = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  return best;
}
