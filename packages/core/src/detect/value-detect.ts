/** Detected `#RGB` or `#RRGGBB` color string. */
export interface ColorDetection {
  readonly hex: string;
  readonly kind: "color";
}

/** Detected unix timestamp in seconds or milliseconds. */
export interface TimestampDetection {
  readonly epochMs: number;
  readonly kind: "timestamp";
  readonly unit: "s" | "ms";
}

/** Result of value heuristic detection. */
export type ValueDetection = ColorDetection | TimestampDetection;

const COLOR_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Detects whether `value` looks like a color or timestamp helper target.
 * @param value JSON value to inspect.
 * @returns Detection result, or `undefined` when no helper applies.
 */
export function detectValue(value: unknown): ValueDetection | undefined {
  if (typeof value === "string") {
    if (COLOR_PATTERN.test(value)) {
      return { hex: normalizeHex(value), kind: "color" };
    }
    return;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    return;
  }

  // Heuristic ranges for unix seconds vs milliseconds.
  if (value >= 1_000_000_000_000 && value < 10_000_000_000_000) {
    return { epochMs: value, kind: "timestamp", unit: "ms" };
  }
  if (value >= 1_000_000_000 && value < 10_000_000_000) {
    return { epochMs: value * 1000, kind: "timestamp", unit: "s" };
  }

  return;
}

/**
 * Formats an epoch millisecond value for display.
 * @param epochMs Epoch milliseconds.
 * @param locale BCP 47 locale (default runtime locale).
 * @returns Localized date-time string.
 */
export function formatTimestamp(epochMs: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(epochMs));
}

/**
 * Expands `#RGB` to `#RRGGBB` and lowercases hex digits.
 * @param hex Color string.
 * @returns Normalized `#rrggbb` string.
 */
function normalizeHex(hex: string): string {
  if (hex.length === 4) {
    const r = hex[1];
    const g = hex[2];
    const b = hex[3];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return hex.toLowerCase();
}
