import styles from "./index.module.css";
import type { ToolbarProps } from "./index.types.js";

/**
 * Horizontal toolbar row for actions and switches.
 * @param props Toolbar props.
 * @returns Toolbar container.
 */
export function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={[styles.toolbar, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
