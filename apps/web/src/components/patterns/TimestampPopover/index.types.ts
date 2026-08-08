/** Props for TimestampPopover. */
export interface TimestampPopoverProps {
  readonly epochMs: number;
  readonly onChangeEpochMs: (epochMs: number) => void;
  readonly unit: "s" | "ms";
}
