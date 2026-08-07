import type { InputHTMLAttributes } from "react";

/** Props for the Input component. */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  readonly label?: string;
}
