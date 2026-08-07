import { detectValue } from "@json-editor/core/detect/value-detect.js";
import { setAtPath } from "@json-editor/core/path/json-path.js";
import type {
  JsonPath,
  JsonValue,
} from "@json-editor/core/types/json.types.js";
import { useMemo, useState } from "react";

import { useDocument } from "../../../hooks/use-document.js";
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
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set([""]));
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

  if (state.json === undefined) {
    return (
      <div className={styles.empty}>
        Tree view requires valid JSON. Switch to text mode or repair the
        document.
      </div>
    );
  }

  const toggle = (path: JsonPath) => {
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
  };

  const commitEdit = (path: JsonPath) => {
    if (state.json === undefined) {
      return;
    }
    setJson(setAtPath(state.json, path, parseLeaf(draft)));
    setEditingPath(undefined);
  };

  const updateValue = (path: JsonPath, value: JsonValue) => {
    if (state.json === undefined) {
      return;
    }
    setJson(setAtPath(state.json, path, value));
  };

  return (
    <div
      className={styles.root}
      onScroll={(event) => {
        setScrollTop(event.currentTarget.scrollTop);
        setViewportHeight(event.currentTarget.clientHeight);
      }}
      ref={(node) => {
        if (node && viewportHeight === 480) {
          setViewportHeight(node.clientHeight);
        }
      }}
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
        onToggle={() => {
          onToggle(row.path);
          onSelect(row.path);
        }}
      />
      <button
        className={styles.key}
        onClick={() => {
          onSelect(row.path);
        }}
        type="button"
      >
        {row.key === undefined ? "$" : `${String(row.key)}:`}
      </button>
      <div className={styles.value}>
        <TreeValue
          draft={draft}
          isEditing={isEditing}
          onCommitEdit={() => {
            onCommitEdit(row.path);
          }}
          onDraftChange={onDraftChange}
          onStartEdit={() => {
            onSelect(row.path);
            onEdit(key);
            onDraftChange(stringifyLeaf(row.value));
          }}
          onStopEdit={() => {
            onEdit(undefined);
          }}
          row={row}
        />
        {leaf && selected ? (
          <TreeHelpers
            detection={detection}
            onUpdateValue={(value) => {
              onUpdateValue(row.path, value);
            }}
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
        onChange={(event) => {
          onDraftChange(event.target.value);
        }}
        onClick={(event) => {
          event.stopPropagation();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            onCommitEdit();
          }
          if (event.key === "Escape") {
            onStopEdit();
          }
        }}
        ref={(node) => {
          node?.focus();
        }}
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
      {stringifyLeaf(row.value)}
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
          onChangeEpochMs={(epochMs) => {
            onUpdateValue(
              detection.unit === "s" ? Math.round(epochMs / 1000) : epochMs,
            );
          }}
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

/**
 * Stringifies a leaf value for editing.
 * @param value Leaf JSON value.
 * @returns Editable text.
 */
function stringifyLeaf(value: JsonValue): string {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Parses an edited leaf back into a JSON value.
 * @param text Draft text.
 * @returns Parsed value (falls back to string).
 */
function parseLeaf(text: string): JsonValue {
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}
