import { type ChangeEvent, useCallback } from "react";

import styles from "./index.module.css";
import type { ColorPickerPopoverProps } from "./index.types.js";

/**
 * Native color picker for hex string values.
 * @param props Color picker props.
 * @returns Color picker control.
 */
export function ColorPickerPopover({ hex, onChange }: ColorPickerPopoverProps) {
  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onChange(event.target.value);
    },
    [onChange],
  );

  return (
    <span className={styles.wrap}>
      <span aria-hidden className={styles.swatch} style={{ background: hex }} />
      <input
        aria-label="Pick color"
        className={styles.input}
        onChange={handleChange}
        type="color"
        value={hex}
      />
    </span>
  );
}
