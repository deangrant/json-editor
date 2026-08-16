import { getAtPath, setAtPath } from "@json-editor/core/path/json-path.js";
import type { JsonValue } from "@json-editor/core/types/json.types.js";
import {
  type ChangeEvent,
  type KeyboardEvent,
  type UIEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import { useDocumentState } from "../../../hooks/use-document.js";
import {
  parseLeafValue,
  stringifyLeafValue,
} from "../../../utils/json-leaf-edit.js";
import { resolveTableCellBlur } from "../../../utils/table-cell-edit.js";
import { getVirtualWindow } from "../../../utils/virtual-window.js";
import styles from "./index.module.css";

const ROW_HEIGHT = 36;

/**
 * Virtualized table editor for arrays of objects.
 * @returns Table mode view.
 */
export function TableView() {
  const { state, setJson } = useDocumentState();
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  const table = useMemo(
    () => buildTable(state.json, state.selection),
    [state.json, state.selection],
  );

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

  const updateCell = useCallback(
    (rowKey: string | number, column: string, text: string) => {
      if (state.json === undefined || !table) {
        return;
      }
      const path = [...table.rootPath, rowKey, column];
      const previous = getAtPath(state.json, path);
      setJson(setAtPath(state.json, path, parseLeafValue(text, previous)));
    },
    [setJson, state.json, table],
  );

  if (!table) {
    return (
      <div className={styles.empty}>
        Table view works on an array of objects (or an object of objects).
        Select a suitable path in tree mode, or use the document root.
      </div>
    );
  }

  const window = getVirtualWindow(
    scrollTop,
    viewportHeight,
    table.rows.length,
    ROW_HEIGHT,
  );
  const visible = table.rows.slice(window.start, window.end);

  return (
    <div
      className={styles.root}
      onScroll={handleScroll}
      ref={handleViewportRef}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>#</th>
            {table.columns.map((column) => (
              <th className={styles.th} key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {window.start > 0 ? (
            <tr style={{ height: window.start * ROW_HEIGHT }}>
              <td colSpan={table.columns.length + 1} />
            </tr>
          ) : null}
          {visible.map((row) => (
            <TableRow
              columns={table.columns}
              key={String(row.key)}
              onUpdateCell={updateCell}
              row={row}
            />
          ))}
          {window.end < table.rows.length ? (
            <tr
              style={{
                height: (table.rows.length - window.end) * ROW_HEIGHT,
              }}
            >
              <td colSpan={table.columns.length + 1} />
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}

/**
 * One table body row with editable cells.
 * @param props Row props.
 * @returns Table row.
 */
function TableRow({
  row,
  columns,
  onUpdateCell,
}: {
  row: {
    key: string | number;
    values: Record<string, JsonValue | undefined>;
  };
  columns: string[];
  onUpdateCell: (rowKey: string | number, column: string, text: string) => void;
}) {
  return (
    <tr style={{ height: ROW_HEIGHT }}>
      <td className={`${styles.td} ${styles.index}`}>{row.key}</td>
      {columns.map((column) => (
        <TableCell
          column={column}
          key={column}
          onUpdateCell={onUpdateCell}
          rowKey={row.key}
          value={row.values[column]}
        />
      ))}
    </tr>
  );
}

/**
 * Editable table cell input with local draft until blur/Enter.
 * @param props Cell props.
 * @returns Table cell.
 */
function TableCell({
  rowKey,
  column,
  value,
  onUpdateCell,
}: {
  rowKey: string | number;
  column: string;
  value: JsonValue | undefined;
  onUpdateCell: (rowKey: string | number, column: string, text: string) => void;
}) {
  const committed = stringifyLeafValue(value);
  // `undefined` means not editing — display follows `committed` without an effect.
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const draftRef = useRef<string | undefined>(undefined);
  const skipCommitRef = useRef(false);
  const display = draft ?? committed;

  const handleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const { value: next } = event.target;
    draftRef.current = next;
    setDraft(next);
  }, []);

  const handleFocus = useCallback(() => {
    draftRef.current = committed;
    setDraft(committed);
  }, [committed]);

  const handleBlur = useCallback(() => {
    const result = resolveTableCellBlur({
      committed,
      draft: draftRef.current,
      skipCommit: skipCommitRef.current,
    });
    skipCommitRef.current = false;
    draftRef.current = undefined;
    setDraft(undefined);
    if (result.action === "commit") {
      onUpdateCell(rowKey, column, result.text);
    }
  }, [column, committed, onUpdateCell, rowKey]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.currentTarget.blur();
      }
      if (event.key === "Escape") {
        skipCommitRef.current = true;
        draftRef.current = undefined;
        setDraft(undefined);
        event.currentTarget.blur();
      }
    },
    [],
  );

  return (
    <td className={styles.td}>
      <input
        aria-label={`${String(rowKey)}.${column}`}
        onBlur={handleBlur}
        onChange={handleChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        value={display}
      />
    </td>
  );
}

interface TableModel {
  columns: string[];
  rootPath: (string | number)[];
  rows: {
    key: string | number;
    values: Record<string, JsonValue | undefined>;
  }[];
}

/**
 * Builds a table model from the selection, document root, or first tableable child.
 * @param root Document root.
 * @param selection Current selection path.
 * @returns Table model, or `undefined` when unsupported.
 */
function buildTable(
  root: JsonValue | undefined,
  selection: readonly (string | number)[],
): TableModel | undefined {
  if (root === undefined) {
    return;
  }

  const candidates = [selection, [] as const];
  for (const path of candidates) {
    const value = getAtPath(root, path);
    const model = toTable(value, [...path]);
    if (model) {
      return model;
    }
  }

  if (root !== null && typeof root === "object" && !Array.isArray(root)) {
    for (const key of Object.keys(root)) {
      const model = toTable(root[key], [key]);
      if (model) {
        return model;
      }
    }
  }
}

/**
 * Converts a JSON value into a table model when possible.
 * @param value Candidate value.
 * @param rootPath Path to the value.
 * @returns Table model, or `undefined`.
 */
function toTable(
  value: JsonValue | undefined,
  rootPath: (string | number)[],
): TableModel | undefined {
  if (value === undefined) {
    return;
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return;
    }
    for (const item of value) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        return;
      }
    }
    const columns = collectColumns(value as Record<string, JsonValue>[]);
    return {
      columns,
      rootPath,
      rows: value.map((item, index) => ({
        key: index,
        values: item as Record<string, JsonValue>,
      })),
    };
  }

  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value);
    if (entries.length === 0) {
      return;
    }
    for (const [, item] of entries) {
      if (item === null || typeof item !== "object" || Array.isArray(item)) {
        return;
      }
    }
    const objects = entries.map(
      ([, item]) => item as Record<string, JsonValue>,
    );
    const columns = collectColumns(objects);
    return {
      columns,
      rootPath,
      rows: entries.map(([key, item]) => ({
        key,
        values: item as Record<string, JsonValue>,
      })),
    };
  }
}

/**
 * Collects the union of object keys as columns.
 * @param rows Object rows.
 * @returns Column names.
 */
function collectColumns(rows: Record<string, JsonValue>[]): string[] {
  const keys = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      keys.add(key);
    }
  }
  return [...keys];
}
