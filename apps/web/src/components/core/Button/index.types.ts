import type { ButtonHTMLAttributes, ReactNode } from "react";

/** Props for the Button component. */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly children: ReactNode;
  readonly size?: "sm" | "md";
  readonly variant?: "primary" | "secondary" | "ghost" | "danger";
}
