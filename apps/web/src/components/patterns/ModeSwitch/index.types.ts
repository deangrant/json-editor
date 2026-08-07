import type { EditorMode } from "../../../types/document.types.js";

/** Props for ModeSwitch. */
export interface ModeSwitchProps {
  readonly mode: EditorMode;
  readonly onChange: (mode: EditorMode) => void;
}
