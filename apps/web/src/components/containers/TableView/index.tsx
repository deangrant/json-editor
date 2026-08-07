import { getAtPath, setAtPath } from "@json-editor/core/path/json-path.js";
import type { JsonValue } from "@json-editor/core/types/json.types.js";
import { useMemo, useState } from "react";

import { useDocument } from "../../../hooks/use-document.js";
import { getVirtualWindow } from "../../../utils/virtual-window.js";
import styles from "./index.module.css";

const ROW_HEIGHT = 36;

/**
 * Virtualized table editor for arrays of objects.
 * @returns Table mode view.
 */
export function TableView() {
  const { state, setJson } = useDocument();
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(480);

  const table = useMemo(
    () => buildTable(state.json, state.selection),
    [state.json, state.selection],
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

  const updateCell = (
    rowKey: string | number,
    column: string,
    text: string,
  ) => {
    if (state.json === undefined) {
      return;
    }
    const path = [...table.rootPath, rowKey, column];
    setJson(setAtPath(state.json, path, parseCell(text)));
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
            <tr key={String(row.key)} style={{ height: ROW_HEIGHT }}>
              <td className={`${styles.td} ${styles.index}`}>{row.key}</td>
              {table.columns.map((column) => (
                <td className={styles.td} key={column}>
                  <input
                    aria-label={`${String(row.key)}.${column}`}
                    onChange={(event) => {
                      updateCell(row.key, column, event.target.value);
                    }}
                    value={stringifyCell(row.values[column])}
                  />
                </td>
              ))}
            </tr>
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

  return;
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
    const objectRows = value.every(
      (item) =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
    if (!objectRows || value.length === 0) {
      return;
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
    const objectRows = entries.every(
      ([, item]) =>
        item !== null && typeof item === "object" && !Array.isArray(item),
    );
    if (!objectRows || entries.length === 0) {
      return;
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

  return;
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

/**
 * Stringifies a cell value for an input.
 * @param value Cell value.
 * @returns Editable text.
 */
function stringifyCell(value: JsonValue | undefined): string {
  if (value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

/**
 * Parses a cell input back to JSON.
 * @param text Input text.
 * @returns Parsed value.
 */
function parseCell(text: string): JsonValue {
  if (text === "") {
    return "";
  }
  try {
    return JSON.parse(text) as JsonValue;
  } catch {
    return text;
  }
}
