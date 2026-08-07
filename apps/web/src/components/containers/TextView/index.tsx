import { useEffect, useRef } from "react";

import { useDocument } from "../../../hooks/use-document.js";
import { runPromise } from "../../../utils/run-promise.js";
import styles from "./index.module.css";

/** Minimal CodeMirror view surface used by this component. */
interface CodeMirrorView {
  destroy: () => void;
  dispatch: (spec: {
    changes: { from: number; to: number; insert: string };
  }) => void;
  state: { doc: { toString: () => string } };
}

/**
 * Plain-text JSON editor powered by CodeMirror.
 * @returns Text mode view.
 */
export function TextView() {
  const { state, setText } = useDocument();
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<CodeMirrorView | null>(null);
  const setTextRef = useRef(setText);
  const initialTextRef = useRef(state.text);
  const applyingExternalChangeRef = useRef(false);

  useEffect(() => {
    setTextRef.current = setText;
  }, [setText]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    let cancelled = false;

    const mount = async () => {
      const [
        { defaultKeymap, history, historyKeymap },
        { json },
        { bracketMatching, foldGutter, foldKeymap },
        { highlightSelectionMatches, searchKeymap },
        { EditorState },
        {
          drawSelection,
          EditorView,
          highlightActiveLine,
          highlightActiveLineGutter,
          keymap,
          lineNumbers,
        },
      ] = await Promise.all([
        import("@codemirror/commands"),
        import("@codemirror/lang-json"),
        import("@codemirror/language"),
        import("@codemirror/search"),
        import("@codemirror/state"),
        import("@codemirror/view"),
      ]);

      if (cancelled || !hostRef.current) {
        return;
      }

      const view = new EditorView({
        parent: hostRef.current,
        state: EditorState.create({
          doc: initialTextRef.current,
          extensions: [
            lineNumbers(),
            highlightActiveLine(),
            highlightActiveLineGutter(),
            foldGutter(),
            drawSelection(),
            bracketMatching(),
            highlightSelectionMatches(),
            history(),
            json(),
            keymap.of([
              ...defaultKeymap,
              ...historyKeymap,
              ...searchKeymap,
              ...foldKeymap,
            ]),
            EditorView.updateListener.of((update) => {
              if (update.docChanged && !applyingExternalChangeRef.current) {
                setTextRef.current(update.state.doc.toString());
              }
            }),
            EditorView.theme({
              "&": {
                height: "100%",
              },
            }),
          ],
        }),
      });

      viewRef.current = view;
      hostRef.current.dataset.cmEditor = "true";
    };

    runPromise(mount());

    return () => {
      cancelled = true;
      viewRef.current?.destroy();
      viewRef.current = null;
      host.dataset.cmEditor = "";
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;
    if (!view) {
      return;
    }
    const current = view.state.doc.toString();
    if (current !== state.text) {
      applyingExternalChangeRef.current = true;
      view.dispatch({
        changes: {
          from: 0,
          insert: state.text,
          to: current.length,
        },
      });
      applyingExternalChangeRef.current = false;
    }
  }, [state.text]);

  return (
    <div className={styles.root}>
      <div className={styles.editor} ref={hostRef} />
    </div>
  );
}
