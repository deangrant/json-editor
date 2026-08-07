import type { ReactNode } from "react";

/** Props for EditorLayout. */
export interface EditorLayoutProps {
  readonly main: ReactNode;
  readonly search: ReactNode;
  readonly side?: ReactNode;
  readonly status: ReactNode;
  readonly toolbar: ReactNode;
}
