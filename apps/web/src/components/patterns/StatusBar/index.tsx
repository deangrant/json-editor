import styles from "./index.module.css";
import type { StatusBarProps } from "./index.types.js";

/**
 * Footer status strip for size warnings and worker activity.
 * @param props Status bar props.
 * @returns Status bar element.
 */
export function StatusBar({ sizeWarning, workerBusy }: StatusBarProps) {
  return (
    <footer className={styles.bar}>
      {sizeWarning ? (
        <span className={`${styles.item} ${styles.warning}`}>
          {sizeWarning}
        </span>
      ) : null}
      {workerBusy ? (
        <span className={`${styles.item} ${styles.busy}`}>Working…</span>
      ) : null}
    </footer>
  );
}
