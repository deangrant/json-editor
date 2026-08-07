import styles from "./index.module.css";
import type { EditorLayoutProps } from "./index.types.js";

/**
 * Page shell for the JSON editor workspace.
 * @param props Layout slot props.
 * @returns Editor layout.
 */
export function EditorLayout({
  toolbar,
  search,
  main,
  side,
  status,
}: EditorLayoutProps) {
  return (
    <div className={styles.shell}>
      <div className={styles.chrome}>
        {toolbar}
        {search}
      </div>
      <div className={styles.workspace}>
        <main className={styles.main}>{main}</main>
        {side ? <div className={styles.side}>{side}</div> : null}
      </div>
      {status}
    </div>
  );
}
