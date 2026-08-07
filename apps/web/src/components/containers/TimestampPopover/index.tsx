import { formatTimestamp } from "@json-editor/core/detect/value-detect.js";
import { type ChangeEvent, useCallback } from "react";

import styles from "./index.module.css";
import type { TimestampPopoverProps } from "./index.types.js";

/**
 * Timestamp helper showing a readable date and datetime-local editor.
 * @param props Timestamp popover props.
 * @returns Timestamp controls.
 */
export function TimestampPopover({
  epochMs,
  unit,
  onChangeEpochMs,
}: TimestampPopoverProps) {
  const localValue = toLocalInputValue(epochMs);

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const next = Date.parse(event.target.value);
      if (!Number.isNaN(next)) {
        onChangeEpochMs(next);
      }
    },
    [onChangeEpochMs],
  );

  return (
    <span className={styles.wrap}>
      <span className={styles.label}>
        {formatTimestamp(epochMs)} ({unit})
      </span>
      <input
        aria-label="Edit timestamp"
        className={styles.input}
        onChange={handleChange}
        type="datetime-local"
        value={localValue}
      />
    </span>
  );
}

/**
 * Converts epoch ms to a `datetime-local` value.
 * @param epochMs Epoch milliseconds.
 * @returns Local datetime string.
 */
function toLocalInputValue(epochMs: number): string {
  const date = new Date(epochMs);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
