import styles from "./index.module.css";
import type { InputProps } from "./index.types.js";

/**
 * Text input with optional label.
 * @param props Input props.
 * @returns Labeled input field.
 */
export function Input({ label, id, className, ...rest }: InputProps) {
  const inputId =
    id ?? (label ? `input-${label.replace(/\s+/g, "-")}` : undefined);

  return (
    <label className={styles.field} htmlFor={inputId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <input
        className={[styles.input, className].filter(Boolean).join(" ")}
        id={inputId}
        {...rest}
      />
    </label>
  );
}
