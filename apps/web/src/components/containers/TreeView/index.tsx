import { detectValue } from "@json-editor/core/detect/value-detect.js";
import {
  deleteAtPath,
  getAtPath,
  renameKey,
  setAtPath,
} from "@json-editor/core/path/json-path.js";
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

import { useDocumentState } from "../../../hooks/use-document.js";
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
import { ColorPickerPopover } from "../../patterns/ColorPickerPopover/index.js";
import { TimestampPopover } from "../../patterns/TimestampPopover/index.js";
import styles from "./index.module.css";

const ROW_HEIGHT = 34;

/**
 * Virtualized expandable tree editor for parsed JSON.
 * @returns Tree mode view.
 */
export function TreeView() {
  const { state, setJson, setSelection } = useDocumentState();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set([pathKeyOf([])]),
  );
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);
  const [editingPath, setEditingPath] = useState<string | undefined>();
  const [draft, setDraft] = useState("");
  const [editingKeyPath, setEditingKeyPath] = useState<string | undefined>();
  const [keyDraft, setKeyDraft] = useState("");
  const [addingPath, setAddingPath] = useState<string | undefined>();
  const [addKeyDraft, setAddKeyDraft] = useState("");

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

  const expandPath = useCallback((path: JsonPath) => {
    const key = pathKeyOf(path);
    setExpanded((current) => {
      if (current.has(key)) {
        return current;
      }
      const next = new Set(current);
      next.add(key);
      return next;
    });
  }, []);

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

  const deleteNode = useCallback(
    (path: JsonPath) => {
      if (state.json === undefined || path.length === 0) {
        return;
      }
      setJson(deleteAtPath(state.json, path));
      setSelection(path.slice(0, -1));
      setEditingKeyPath(undefined);
      setAddingPath(undefined);
    },
    [setJson, setSelection, state.json],
  );

  const startRename = useCallback(
    (path: JsonPath) => {
      const segment = path.at(-1);
      if (typeof segment !== "string") {
        return;
      }
      setSelection(path);
      setEditingKeyPath(pathKeyOf(path));
      setKeyDraft(segment);
      setAddingPath(undefined);
      setEditingPath(undefined);
    },
    [setSelection],
  );

  const cancelRename = useCallback(() => {
    setEditingKeyPath(undefined);
  }, []);

  const commitRename = useCallback(
    (path: JsonPath) => {
      if (state.json === undefined || path.length === 0) {
        return;
      }
      const fromKey = path.at(-1);
      if (typeof fromKey !== "string") {
        return;
      }
      const toKey = keyDraft.trim();
      if (!toKey || toKey === fromKey) {
        setEditingKeyPath(undefined);
        return;
      }
      try {
        const parentPath = path.slice(0, -1);
        setJson(renameKey(state.json, parentPath, fromKey, toKey));
        setSelection([...parentPath, toKey]);
        setEditingKeyPath(undefined);
      } catch {
        // Keep the draft when the target key already exists.
      }
    },
    [keyDraft, setJson, setSelection, state.json],
  );

  const startAdd = useCallback(
    (path: JsonPath) => {
      if (state.json === undefined) {
        return;
      }
      const value = getAtPath(state.json, path);
      if (Array.isArray(value)) {
        const nextPath = [...path, value.length] as JsonPath;
        setJson(setAtPath(state.json, nextPath, null));
        expandPath(path);
        setSelection(nextPath);
        setAddingPath(undefined);
        setEditingKeyPath(undefined);
        return;
      }
      if (value !== null && typeof value === "object") {
        setSelection(path);
        setAddingPath(pathKeyOf(path));
        setAddKeyDraft("");
        setEditingKeyPath(undefined);
        setEditingPath(undefined);
        expandPath(path);
      }
    },
    [expandPath, setJson, setSelection, state.json],
  );

  const cancelAdd = useCallback(() => {
    setAddingPath(undefined);
  }, []);

  const commitAddKey = useCallback(
    (path: JsonPath) => {
      if (state.json === undefined) {
        return;
      }
      const key = addKeyDraft.trim();
      if (!key) {
        setAddingPath(undefined);
        return;
      }
      const parent = getAtPath(state.json, path);
      if (
        parent === null ||
        typeof parent !== "object" ||
        Array.isArray(parent) ||
        key in parent
      ) {
        return;
      }
      const nextPath = [...path, key] as JsonPath;
      setJson(setAtPath(state.json, nextPath, null));
      expandPath(path);
      setSelection(nextPath);
      setAddingPath(undefined);
    },
    [addKeyDraft, expandPath, setJson, setSelection, state.json],
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
      aria-label="JSON tree"
      className={styles.root}
      onScroll={handleScroll}
      ref={handleViewportRef}
      role="tree"
    >
      <div
        className={styles.viewport}
        style={{ height: filtered.length * ROW_HEIGHT }}
      >
        <div style={{ transform: `translateY(${window.offsetY}px)` }}>
          {visible.map((row) => (
            <TreeRowItem
              addingPath={addingPath}
              addKeyDraft={addKeyDraft}
              draft={draft}
              editingKeyPath={editingKeyPath}
              editingPath={editingPath}
              key={pathKeyOf(row.path) || "root"}
              keyDraft={keyDraft}
              onAdd={startAdd}
              onAddKeyDraftChange={setAddKeyDraft}
              onCancelAdd={cancelAdd}
              onCancelRename={cancelRename}
              onCommitAddKey={commitAddKey}
              onCommitEdit={commitEdit}
              onCommitRename={commitRename}
              onDelete={deleteNode}
              onDraftChange={setDraft}
              onEdit={setEditingPath}
              onKeyDraftChange={setKeyDraft}
              onSelect={setSelection}
              onStartRename={startRename}
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
  readonly addingPath: string | undefined;
  readonly addKeyDraft: string;
  readonly draft: string;
  readonly editingKeyPath: string | undefined;
  readonly editingPath: string | undefined;
  readonly keyDraft: string;
  readonly onAdd: (path: JsonPath) => void;
  readonly onAddKeyDraftChange: (value: string) => void;
  readonly onCancelAdd: () => void;
  readonly onCancelRename: () => void;
  readonly onCommitAddKey: (path: JsonPath) => void;
  readonly onCommitEdit: (path: JsonPath) => void;
  readonly onCommitRename: (path: JsonPath) => void;
  readonly onDelete: (path: JsonPath) => void;
  readonly onDraftChange: (value: string) => void;
  readonly onEdit: (pathKey: string | undefined) => void;
  readonly onKeyDraftChange: (value: string) => void;
  readonly onSelect: (path: JsonPath) => void;
  readonly onStartRename: (path: JsonPath) => void;
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
  editingKeyPath,
  keyDraft,
  addingPath,
  addKeyDraft,
  onToggle,
  onSelect,
  onCommitEdit,
  onDraftChange,
  onEdit,
  onUpdateValue,
  onDelete,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onKeyDraftChange,
  onAdd,
  onCommitAddKey,
  onCancelAdd,
  onAddKeyDraftChange,
}: TreeRowItemProps) {
  const key = pathKeyOf(row.path);
  const detection = detectValue(row.value);
  const isEditing = editingPath === key;
  const isRenaming = editingKeyPath === key;
  const isAdding = addingPath === key;
  const leaf = !row.expandable;
  const selected = selectedKey === key;
  const canDelete = row.path.length > 0;
  const canRename = typeof row.key === "string";
  const canAdd =
    Array.isArray(row.value) ||
    (row.value !== null &&
      typeof row.value === "object" &&
      !Array.isArray(row.value));

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

  const handleDelete = useCallback(() => {
    onDelete(row.path);
  }, [onDelete, row.path]);

  const handleStartRename = useCallback(() => {
    onStartRename(row.path);
  }, [onStartRename, row.path]);

  const handleCommitRename = useCallback(() => {
    onCommitRename(row.path);
  }, [onCommitRename, row.path]);

  const handleAdd = useCallback(() => {
    onAdd(row.path);
  }, [onAdd, row.path]);

  const handleCommitAddKey = useCallback(() => {
    onCommitAddKey(row.path);
  }, [onCommitAddKey, row.path]);

  return (
    <div
      aria-expanded={row.expandable ? row.expanded : undefined}
      aria-level={row.depth + 1}
      aria-selected={selected}
      className={[styles.row, selected ? styles.rowSelected : ""]
        .filter(Boolean)
        .join(" ")}
      role="treeitem"
      style={{
        height: ROW_HEIGHT,
        paddingLeft: `${0.75 + row.depth * 1.1}rem`,
      }}
      tabIndex={selected ? 0 : -1}
    >
      <TreeToggle
        expandable={row.expandable}
        expanded={row.expanded}
        onToggle={handleToggle}
      />
      <TreeKey
        isRenaming={isRenaming}
        keyDraft={keyDraft}
        onCancelRename={onCancelRename}
        onCommitRename={handleCommitRename}
        onKeyDraftChange={onKeyDraftChange}
        onSelect={handleSelect}
        row={row}
      />
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
        {selected ? (
          <TreeStructuralActions
            {...(canAdd ? { add: handleAdd } : {})}
            {...(canDelete ? { remove: handleDelete } : {})}
            {...(canRename ? { rename: handleStartRename } : {})}
            {...(isAdding
              ? {
                  adding: {
                    draft: addKeyDraft,
                    onCancel: onCancelAdd,
                    onCommit: handleCommitAddKey,
                    onDraftChange: onAddKeyDraftChange,
                  },
                }
              : {})}
          />
        ) : null}
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
 * Key label or inline rename editor for a tree row.
 * @param props Key props.
 * @returns Key control.
 */
function TreeKey({
  row,
  isRenaming,
  keyDraft,
  onSelect,
  onKeyDraftChange,
  onCommitRename,
  onCancelRename,
}: {
  row: TreeRow;
  isRenaming: boolean;
  keyDraft: string;
  onSelect: () => void;
  onKeyDraftChange: (value: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
}) {
  const handleDraftChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      onKeyDraftChange(event.target.value);
    },
    [onKeyDraftChange],
  );

  const handleClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        onCommitRename();
      }
      if (event.key === "Escape") {
        onCancelRename();
      }
    },
    [onCancelRename, onCommitRename],
  );

  const handleEditRef = useCallback((node: HTMLInputElement | null) => {
    node?.focus();
  }, []);

  if (isRenaming) {
    return (
      <input
        aria-label="Rename key"
        className={styles.keyEdit}
        onBlur={onCommitRename}
        onChange={handleDraftChange}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        ref={handleEditRef}
        value={keyDraft}
      />
    );
  }

  return (
    <button className={styles.key} onClick={onSelect} type="button">
      {row.key === undefined ? "$" : `${String(row.key)}:`}
    </button>
  );
}

/**
 * Structural Add / Rename / Delete controls for the selected row.
 * @param props Action props. Optional handlers/slots enable each action.
 * @returns Action controls.
 */
function TreeStructuralActions({
  add,
  rename,
  remove,
  adding,
}: {
  add?: () => void;
  rename?: () => void;
  remove?: () => void;
  adding?: {
    draft: string;
    onCancel: () => void;
    onCommit: () => void;
    onDraftChange: (value: string) => void;
  };
}) {
  const handleAddKeyDraftChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      adding?.onDraftChange(event.target.value);
    },
    [adding],
  );

  const handleClick = useCallback((event: MouseEvent<HTMLInputElement>) => {
    event.stopPropagation();
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        adding?.onCommit();
      }
      if (event.key === "Escape") {
        adding?.onCancel();
      }
    },
    [adding],
  );

  const handleEditRef = useCallback((node: HTMLInputElement | null) => {
    node?.focus();
  }, []);

  if (!(add || rename || remove || adding)) {
    return null;
  }

  return (
    <div className={styles.helpers}>
      {add ? (
        <button className={styles.action} onClick={add} type="button">
          Add
        </button>
      ) : null}
      {rename ? (
        <button className={styles.action} onClick={rename} type="button">
          Rename
        </button>
      ) : null}
      {remove ? (
        <button className={styles.action} onClick={remove} type="button">
          Delete
        </button>
      ) : null}
      {adding ? (
        <input
          aria-label="New property key"
          className={styles.keyEdit}
          onBlur={adding.onCommit}
          onChange={handleAddKeyDraftChange}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          placeholder="new key"
          ref={handleEditRef}
          value={adding.draft}
        />
      ) : null}
    </div>
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
