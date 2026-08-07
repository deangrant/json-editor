import { useEffect } from "react";

import { useDocument } from "./use-document.js";

/**
 * Binds Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z to undo/redo.
 */
export function useHistoryShortcuts(): void {
  const { undo, redo } = useDocument();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const modifier = event.metaKey || event.ctrlKey;
      if (!modifier || event.key.toLowerCase() !== "z") {
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("[data-cm-editor='true']")
      ) {
        // CodeMirror owns its own history while typing in text mode.
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
