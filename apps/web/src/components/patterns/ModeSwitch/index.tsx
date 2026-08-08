import { useCallback } from "react";

import { EDITOR_MODES } from "../../../constants/app.constants.js";
import type { EditorMode } from "../../../types/document.types.js";
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
        <ModeButton
          active={mode === item}
          item={item}
          key={item}
          onChange={onChange}
        />
      ))}
    </fieldset>
  );
}

/**
 * Single mode toggle button.
 * @param props Mode button props.
 * @returns Mode button.
 */
function ModeButton({
  item,
  active,
  onChange,
}: {
  item: EditorMode;
  active: boolean;
  onChange: (mode: EditorMode) => void;
}) {
  const handleClick = useCallback(() => {
    onChange(item);
  }, [item, onChange]);

  return (
    <button
      aria-pressed={active}
      className={[styles.button, active ? styles.active : ""]
        .filter(Boolean)
        .join(" ")}
      onClick={handleClick}
      type="button"
    >
      {item}
    </button>
  );
}
