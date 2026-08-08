import { detectValue } from "@json-editor/core/detect/value-detect.js";
import { getAtPath, setAtPath } from "@json-editor/core/path/json-path.js";
import type {
  JsonPath,
  JsonValue,
} from "@json-editor/core/types/json.types.js";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
  type UIEvent,
  useCallback,
  useMemo,
  useState,
} from "react";

import { useDocument } from "../../../hooks/use-document.js";
import {
  parseLeafValue,
  stringifyLeafValue,
} from "../../../utils/json-leaf-edit.js";
import {
  flattenTree,
  pathKeyOf,
  type TreeRow,
} from "../../../utils/tree-flatten.js";
import { getVirtualWindow } from "../../../utils/virtual-window.js";
import { ColorPickerPopover } from "../ColorPickerPopover/index.js";
import { TimestampPopover } from "../TimestampPopover/index.js";
import styles from "./index.module.css";

const ROW_HEIGHT = 34;

/**
 * Virtualized expandable tree editor for parsed JSON.
 * @returns Tree mode view.
 */
export function TreeView() {
  const { state, setJson, setSelection } = useDocument();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([pathKeyOf([])]),
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const [editingPath, setEditingPath] = useState<string | undefined>();
  const [draft, setDraft] = useState("");

  const rows = useMemo(() => {
    if (state.json === undefined) {
      return [];
    }
    return flattenTree(state.json, expanded);
  }, [expanded, state.json]);

  const filtered = useMemo(() => {
    const query = state.searchQuery.trim().toLowerCase();
    if (!query) {
      return rows;
    }
    return rows.filter((row) => matchesSearch(row, query));
  }, [rows, state.searchQuery]);

  const window = getVirtualWindow(
    scrollTop,
    viewportHeight,
    filtered.length,
    ROW_HEIGHT,
  );
  const visible = filtered.slice(window.start, window.end);
  const selectedKey = pathKeyOf(state.selection);

  const handleScroll = useCallback((event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
    setViewportHeight(event.currentTarget.clientHeight);
  }, []);

  const handleViewportRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (node && viewportHeight === 480) {
        setViewportHeight(node.clientHeight);
      }
    },
    [viewportHeight],
  );

  const toggle = useCallback((path: JsonPath) => {
    const key = pathKeyOf(path);
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  const commitEdit = useCallback(
    (path: JsonPath) => {
      if (state.json === undefined) {
        return;
      }
      const previous = getAtPath(state.json, path);
      setJson(setAtPath(state.json, path, parseLeafValue(draft, previous)));
      setEditingPath(undefined);
    },
    [draft, setJson, state.json],
  );

  const updateValue = useCallback(
    (path: JsonPath, value: JsonValue) => {
      if (state.json === undefined) {
        return;
      }
      setJson(setAtPath(state.json, path, value));
    },
    [setJson, state.json],
  );

  if (state.json === undefined) {
    return (
      <div className={styles.empty}>
        Tree view requires valid JSON. Switch to text mode or repair the
        document.
      </div>
    );
  }

  return (
    <div
      className={styles.root}
      onScroll={handleScroll}
      ref={handleViewportRef}
    >
      <div
        className={styles.viewport}
        style={{ height: filtered.length * ROW_HEIGHT }}
      >
        <div style={{ transform: `translateY(${window.offsetY}px)` }}>
          {visible.map((row) => (
            <TreeRowItem
              draft={draft}
              editingPath={editingPath}
              key={pathKeyOf(row.path) || "root"}
              onCommitEdit={commitEdit}
              onDraftChange={setDraft}
              onEdit={setEditingPath}
              onSelect={setSelection}
              onToggle={toggle}
              onUpdateValue={updateValue}
              row={row}
              selectedKey={selectedKey}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TreeRowItemProps {
  readonly draft: string;
  readonly editingPath: string | undefined;
  readonly onCommitEdit: (path: JsonPath) => void;
  readonly onDraftChange: (value: string) => void;
  readonly onEdit: (pathKey: string | undefined) => void;
  readonly onSelect: (path: JsonPath) => void;
  readonly onToggle: (path: JsonPath) => void;
  readonly onUpdateValue: (path: JsonPath, value: JsonValue) => void;
  readonly row: TreeRow;
  readonly selectedKey: string;
}

/**
 * Renders one virtualized tree row.
 * @param props Row props.
 * @returns Row element.
 */
function TreeRowItem({
  row,
  selectedKey,
  editingPath,
  draft,
  onToggle,
  onSelect,
  onCommitEdit,
  onDraftChange,
  onEdit,
  onUpdateValue,
}: TreeRowItemProps) {
  const key = pathKeyOf(row.path);
  const detection = detectValue(row.value);
  const isEditing = editingPath === key;
  const leaf = !row.expandable;
  const selected = selectedKey === key;

  const handleToggle = useCallback(() => {
    onToggle(row.path);
    onSelect(row.path);
  }, [onSelect, onToggle, row.path]);

  const handleSelect = useCallback(() => {
    onSelect(row.path);
  }, [onSelect, row.path]);

  const handleCommitEdit = useCallback(() => {
    onCommitEdit(row.path);
  }, [onCommitEdit, row.path]);

  const handleStartEdit = useCallback(() => {
    onSelect(row.path);
    onEdit(key);
    onDraftChange(stringifyLeafValue(row.value));
  }, [key, onDraftChange, onEdit, onSelect, row.path, row.value]);

  const handleStopEdit = useCallback(() => {
    onEdit(undefined);
  }, [onEdit]);

  const handleUpdateValue = useCallback(
    (value: JsonValue) => {
      onUpdateValue(row.path, value);
    },
    [onUpdateValue, row.path],
  );

  return (
    <div
      className={[styles.row, selected ? styles.rowSelected : ""]
        .filter(Boolean)
        .join(" ")}
      style={{
        height: ROW_HEIGHT,
        paddingLeft: `${0.75 + row.depth * 1.1}rem`,
      }}
    >
      <TreeToggle
        expandable={row.expandable}
        expanded={row.expanded}
        onToggle={handleToggle}
      />
      <button className={styles.key} onClick={handleSelect} type="button">
        {row.key === undefined ? "$" : `${String(row.key)}:`}
      </button>
      <div className={styles.value}>
        <TreeValue
          draft={draft}
          isEditing={isEditing}
          onCommitEdit={handleCommitEdit}
          onDraftChange={onDraftChange}
          onStartEdit={handleStartEdit}
          onStopEdit={handleStopEdit}
          row={row}
        />
        {leaf && selected ? (
          <TreeHelpers
            detection={detection}
            onUpdateValue={handleUpdateValue}
          />
        ) : null}
      </div>
    </div>
  );
}

/**
 * Expand/collapse control for a tree row.
 * @param props Toggle props.
 * @returns Toggle control.
 */
function TreeToggle({
  expandable,
  expanded,
  onToggle,
}: {
  expandable: boolean;
  expanded: boolean;
  onToggle: () => void;
}) {
  if (!expandable) {
    return <span className={styles.toggle} />;
  }
  return (
    <button
      aria-label={expanded ? "Collapse" : "Expand"}
      className={styles.toggle}
      onClick={onToggle}
      type="button"
    >
      {expanded ? "▾" : "▸"}
    </button>
  );
}

/**
 * Value cell for a tree row.
 * @param props Value props.
 * @returns Value cell contents.
 */
function TreeValue({
  row,
  isEditing,
  draft,
  onDraftChange,
  onCommitEdit,
  onStopEdit,
  onStartEdit,
}: {
  row: TreeRow;
  isEditing: boolean;
  draft: string;
  onDraftChange: (value: string) => void;
  onCommitEdit: () => void;
  onStopEdit: () => void;
  onStartEdit: () => void;
}) {
  const handleDraftChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onDraftChange(event.target.value);
    },
    [onDraftChange],
  );

  const handleClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        onCommitEdit();
      }
      if (event.key === "Escape") {
        onStopEdit();
      }
    },
    [onCommitEdit, onStopEdit],
  );

  const handleEditRef = useCallback((node: HTMLInputElement | null) => {
    node?.focus();
  }, []);

  if (row.expandable) {
    return (
      <span className={styles.meta}>
        {Array.isArray(row.value)
          ? `Array(${row.value.length})`
          : `Object(${Object.keys(row.value as object).length})`}
      </span>
    );
  }

  if (isEditing) {
    return (
      <input
        aria-label="Edit JSON value"
        className={styles.edit}
        onBlur={onCommitEdit}
        onChange={handleDraftChange}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        ref={handleEditRef}
        value={draft}
      />
    );
  }

  return (
    <button
      aria-label="Edit JSON value"
      className={valueClass(row.value)}
      onClick={onStartEdit}
      type="button"
    >
      {stringifyLeafValue(row.value)}
    </button>
  );
}

/**
 * Color/timestamp helpers for the selected leaf.
 * @param props Helper props.
 * @returns Helper controls, or null.
 */
function TreeHelpers({
  detection,
  onUpdateValue,
}: {
  detection: ReturnType<typeof detectValue>;
  onUpdateValue: (value: JsonValue) => void;
}) {
  const handleTimestampChange = useCallback(
    (epochMs: number) => {
      if (detection?.kind !== "timestamp") {
        return;
      }
      onUpdateValue(
        detection.unit === "s" ? Math.round(epochMs / 1000) : epochMs,
      );
    },
    [detection, onUpdateValue],
  );

  if (detection?.kind === "color") {
    return (
      <div className={styles.helpers}>
        <ColorPickerPopover hex={detection.hex} onChange={onUpdateValue} />
      </div>
    );
  }
  if (detection?.kind === "timestamp") {
    return (
      <div className={styles.helpers}>
        <TimestampPopover
          epochMs={detection.epochMs}
          onChangeEpochMs={handleTimestampChange}
          unit={detection.unit}
        />
      </div>
    );
  }
  return null;
}

/**
 * Whether a row matches the search query.
 * @param row Tree row.
 * @param query Lowercased query.
 * @returns True when the row matches.
 */
function matchesSearch(row: TreeRow, query: string): boolean {
  const keyText = row.key === undefined ? "" : String(row.key);
  const valueText =
    typeof row.value === "string" || typeof row.value === "number"
      ? String(row.value)
      : "";
  return (
    keyText.toLowerCase().includes(query) ||
    valueText.toLowerCase().includes(query)
  );
}

/**
 * CSS class for a primitive value type.
 * @param value JSON value.
 * @returns Class name string.
 */
function valueClass(value: JsonValue): string {
  if (value === null) {
    return styles.null ?? "";
  }
  if (typeof value === "string") {
    return styles.string ?? "";
  }
  if (typeof value === "number") {
    return styles.number ?? "";
  }
  if (typeof value === "boolean") {
    return styles.boolean ?? "";
  }
  return styles.meta ?? "";
}
