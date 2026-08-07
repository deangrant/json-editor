import type { ReactNode } from "react";

/** Props for the Badge component. */
export interface BadgeProps {
  readonly children: ReactNode;
  readonly tone?: "neutral" | "accent" | "danger" | "warning" | "success";
}
