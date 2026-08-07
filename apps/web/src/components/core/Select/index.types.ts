import type { SelectHTMLAttributes } from "react";

/** Option for the Select component. */
export interface SelectOption {
  readonly label: string;
  readonly value: string;
}

/** Props for the Select component. */
export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  readonly label?: string;
  readonly options: readonly SelectOption[];
}
