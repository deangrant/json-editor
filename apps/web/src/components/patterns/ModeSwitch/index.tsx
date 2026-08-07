import { EDITOR_MODES } from "../../../constants/app.constants.js";
import styles from "./index.module.css";
import type { ModeSwitchProps } from "./index.types.js";

/**
 * Switches between tree, text, and table editor modes.
 * @param props Mode switch props.
 * @returns Mode toggle group.
 */
export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <fieldset aria-label="Editor mode" className={styles.group}>
      {EDITOR_MODES.map((item) => (
        <button
          className={[styles.button, mode === item ? styles.active : ""]
            .filter(Boolean)
            .join(" ")}
          key={item}
          onClick={() => {
            onChange(item);
          }}
          type="button"
        >
          {item}
        </button>
      ))}
    </fieldset>
  );
}
