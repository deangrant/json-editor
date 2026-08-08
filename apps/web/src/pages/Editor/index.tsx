import { lazy, type ReactNode, Suspense, useCallback } from "react";

import {
  EditorToolbar,
  SchemaPanel,
  TableView,
  TransformPanel,
  TreeView,
} from "../../components/containers/index.js";
import { EditorLayout } from "../../components/layouts/index.js";
import {
  SearchReplaceBar,
  StatusBar,
} from "../../components/patterns/index.js";
import {
  useDocumentSearch,
  useDocumentState,
} from "../../hooks/use-document.js";
import { useHistoryShortcuts } from "../../hooks/use-history-shortcuts.js";

const TextView = lazy(async () => {
  const module = await import("../../components/containers/index.js");
  return { default: module.TextView };
});

/**
 * Main editor page wiring layout, modes, and panels.
 * @returns Editor page.
 */
export function EditorPage() {
  const { state } = useDocumentState();
  const { setSearchQuery, setReplaceValue, replaceInText } =
    useDocumentSearch();
  useHistoryShortcuts();

  const handleReplace = useCallback(() => {
    replaceInText(state.searchQuery, state.replaceValue, false);
  }, [replaceInText, state.replaceValue, state.searchQuery]);

  const handleReplaceAll = useCallback(() => {
    replaceInText(state.searchQuery, state.replaceValue, true);
  }, [replaceInText, state.replaceValue, state.searchQuery]);

  return (
    <EditorLayout
      main={<EditorMain mode={state.mode} />}
      search={
        <SearchReplaceBar
          onQueryChange={setSearchQuery}
          onReplace={handleReplace}
          onReplaceAll={handleReplaceAll}
          onReplaceChange={setReplaceValue}
          query={state.searchQuery}
          replaceEnabled={state.mode === "text"}
          replaceValue={state.replaceValue}
          searchPlaceholder={state.mode === "text" ? "Find…" : "Filter…"}
        />
      }
      side={<EditorSidePanel panel={state.sidePanel} />}
      status={
        <StatusBar
          sizeWarning={state.sizeWarning}
          workerBusy={state.workerBusy}
        />
      }
      toolbar={<EditorToolbar />}
    />
  );
}

/**
 * Renders the active editor mode view.
 * @param props Mode props.
 * @returns Mode view element.
 */
function EditorMain({ mode }: { mode: "tree" | "text" | "table" }): ReactNode {
  if (mode === "text") {
    return (
      <Suspense fallback={<p>Loading text editor…</p>}>
        <TextView />
      </Suspense>
    );
  }
  if (mode === "table") {
    return <TableView />;
  }
  return <TreeView />;
}

/**
 * Renders the active side panel, if any.
 * @param props Panel props.
 * @returns Side panel element, or `undefined`.
 */
function EditorSidePanel({
  panel,
}: {
  panel: "none" | "schema" | "transform";
}): ReactNode {
  if (panel === "schema") {
    return <SchemaPanel />;
  }
  if (panel === "transform") {
    return <TransformPanel />;
  }
}
