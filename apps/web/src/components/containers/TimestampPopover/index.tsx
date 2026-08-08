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
      const next = parseLocalInputValue(event.target.value);
      if (next !== undefined) {
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
 * Converts epoch ms to a `datetime-local` value in local wall time.
 * @param epochMs Epoch milliseconds.
 * @returns Local datetime string with seconds.
 */
function toLocalInputValue(epochMs: number): string {
  const date = new Date(epochMs);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

/**
 * Parses a `datetime-local` value as local wall time.
 * @param value Input value from the control.
 * @returns Epoch milliseconds, or `undefined` when invalid.
 */
function parseLocalInputValue(value: string): number | undefined {
  const [datePart, timePart] = value.split("T");
  if (!(datePart && timePart)) {
    return;
  }

  const dateParts = datePart.split("-").map(Number);
  const timeParts = timePart.split(":").map(Number);
  if (dateParts.length < 3 || timeParts.length < 2) {
    return;
  }

  const [year, month, day] = dateParts;
  const [hour, minute, second = 0] = timeParts;
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined ||
    [year, month, day, hour, minute, second].some((part) => Number.isNaN(part))
  ) {
    return;
  }

  const epochMs = new Date(
    year,
    month - 1,
    day,
    hour,
    minute,
    second,
  ).getTime();
  if (Number.isNaN(epochMs)) {
    return;
  }
  return epochMs;
}
