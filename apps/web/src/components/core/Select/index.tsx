import styles from "./index.module.css";
import type { SelectProps } from "./index.types.js";

/**
 * Native select control with optional label.
 * @param props Select props.
 * @returns Labeled select element.
 */
export function Select({
  label,
  options,
  id,
  className,
  ...rest
}: SelectProps) {
  const selectId =
    id ?? (label ? `select-${label.replace(/\s+/g, "-")}` : undefined);

  return (
    <label className={styles.field} htmlFor={selectId}>
      {label ? <span className={styles.label}>{label}</span> : null}
      <select
        className={[styles.select, className].filter(Boolean).join(" ")}
        id={selectId}
        {...rest}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}
