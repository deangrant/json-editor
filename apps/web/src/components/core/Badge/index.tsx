import styles from "./index.module.css";
import type { BadgeProps } from "./index.types.js";

/**
 * Compact status badge.
 * @param props Badge props.
 * @returns Badge element.
 */
export function Badge({ children, tone = "neutral" }: BadgeProps) {
  return <span className={`${styles.badge} ${styles[tone]}`}>{children}</span>;
}
