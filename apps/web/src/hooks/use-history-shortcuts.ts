import { useEffect } from "react";

import { useDocument } from "./use-document.js";

/**
 * Binds Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z to document undo/redo in all modes.
 */
export function useHistoryShortcuts(): void {
  const { undo, redo } = useDocument();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier || event.key.toLowerCase() !== "z") {
        return;
      }
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [redo, undo]);
}
