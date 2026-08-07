import { useDocument } from "../../../hooks/use-document.js";
import { runPromise } from "../../../utils/run-promise.js";
import { Button } from "../../core/Button/index.js";
import { Toolbar } from "../../core/Toolbar/index.js";
import { ModeSwitch } from "../../patterns/ModeSwitch/index.js";
import styles from "./index.module.css";

/**
 * Top toolbar with file actions, mode switch, and repair banner.
 * @returns Editor toolbar.
 */
export function EditorToolbar() {
  const {
    state,
    canUndo,
    canRedo,
    setMode,
    setSidePanel,
    openFile,
    saveFile,
    format,
    compact,
    repair,
    acceptRepair,
    validate,
    undo,
    redo,
  } = useDocument();

  return (
    <>
      <Toolbar>
        <ModeSwitch mode={state.mode} onChange={setMode} />
        <div className={styles.spacer} />
        <div className={styles.group}>
          <Button
            onClick={() => {
              runPromise(openFile());
            }}
            size="sm"
          >
            Open
          </Button>
          <Button onClick={saveFile} size="sm">
            Save
          </Button>
          <Button disabled={!canUndo} onClick={undo} size="sm" variant="ghost">
            Undo
          </Button>
          <Button disabled={!canRedo} onClick={redo} size="sm" variant="ghost">
            Redo
          </Button>
          <Button
            disabled={state.json === undefined}
            onClick={() => {
              runPromise(format());
            }}
            size="sm"
          >
            Format
          </Button>
          <Button
            disabled={state.json === undefined}
            onClick={() => {
              runPromise(compact());
            }}
            size="sm"
          >
            Compact
          </Button>
          <Button
            onClick={() => {
              runPromise(repair());
            }}
            size="sm"
          >
            Repair
          </Button>
          <Button
            onClick={() => {
              runPromise(validate());
            }}
            size="sm"
          >
            Validate
          </Button>
          <Button
            onClick={() => {
              setSidePanel(state.sidePanel === "schema" ? "none" : "schema");
            }}
            size="sm"
            variant={state.sidePanel === "schema" ? "primary" : "secondary"}
          >
            Schema
          </Button>
          <Button
            onClick={() => {
              setSidePanel(
                state.sidePanel === "transform" ? "none" : "transform",
              );
            }}
            size="sm"
            variant={state.sidePanel === "transform" ? "primary" : "secondary"}
          >
            Transform
          </Button>
        </div>
      </Toolbar>
      {state.parseError ? (
        <div className={styles.banner}>
          <span>
            Invalid JSON: {state.parseError.message}
            {state.parseError.position === undefined
              ? ""
              : ` (position ${state.parseError.position})`}
          </span>
          <div className={styles.bannerActions}>
            <Button
              onClick={() => {
                runPromise(repair());
              }}
              size="sm"
              variant="danger"
            >
              Suggest repair
            </Button>
            {state.repairSuggestion ? (
              <Button onClick={acceptRepair} size="sm" variant="primary">
                Accept repair
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
      {state.repairSuggestion && !state.parseError ? (
        <div className={styles.banner}>
          <span>Repair suggestion ready.</span>
          <div className={styles.bannerActions}>
            <Button onClick={acceptRepair} size="sm" variant="primary">
              Accept repair
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
