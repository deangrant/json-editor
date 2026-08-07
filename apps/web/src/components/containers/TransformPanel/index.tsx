import type {
  FilterOperator,
  TransformOp,
  TransformProgram,
} from "@json-editor/core/query/transform.types.js";
import { useMemo, useState } from "react";

import { useDocument } from "../../../hooks/use-document.js";
import { runPromise } from "../../../utils/run-promise.js";
import { Button } from "../../core/Button/index.js";
import { Input } from "../../core/Input/index.js";
import { Select } from "../../core/Select/index.js";
import styles from "./index.module.css";

const NUMERIC_SEGMENT = /^\d+$/;

const OPERATORS: { label: string; value: FilterOperator }[] = [
  { label: "equals", value: "eq" },
  { label: "not equals", value: "neq" },
  { label: "greater than", value: "gt" },
  { label: "greater or equal", value: "gte" },
  { label: "less than", value: "lt" },
  { label: "less or equal", value: "lte" },
  { label: "contains", value: "contains" },
  { label: "exists", value: "exists" },
];

/**
 * Side panel for building and applying transform DSL programs.
 * @returns Transform panel.
 */
export function TransformPanel() {
  const { state, previewTransform, applyTransform } = useDocument();
  const [rootPathText, setRootPathText] = useState("items");
  const [filterField, setFilterField] = useState("active");
  const [filterOperator, setFilterOperator] = useState<FilterOperator>("eq");
  const [filterValue, setFilterValue] = useState("true");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pickFields, setPickFields] = useState("id,name,active");
  const [limit, setLimit] = useState("50");

  const program = useMemo((): TransformProgram => {
    const ops: TransformOp[] = [];
    if (filterField.trim()) {
      ops.push({
        field: filterField.trim(),
        operator: filterOperator,
        type: "filter",
        ...(filterOperator === "exists"
          ? {}
          : { value: parseFilterValue(filterValue) }),
      });
    }
    if (sortField.trim()) {
      ops.push({
        direction: sortDirection,
        field: sortField.trim(),
        type: "sort",
      });
    }
    const fields = pickFields
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    if (fields.length > 0) {
      ops.push({ fields, type: "pick" });
    }
    const count = Number.parseInt(limit, 10);
    if (!Number.isNaN(count)) {
      ops.push({ count, type: "limit" });
    }

    return {
      ops,
      rootPath: rootPathText
        .split(".")
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => (NUMERIC_SEGMENT.test(part) ? Number(part) : part)),
    };
  }, [
    filterField,
    filterOperator,
    filterValue,
    limit,
    pickFields,
    rootPathText,
    sortDirection,
    sortField,
  ]);

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Transform</h2>
      <p className={styles.help}>
        Built-in filter → sort → pick → limit pipeline on an array path.
      </p>
      <div className={styles.grid}>
        <Input
          label="Root path"
          onChange={(event) => {
            setRootPathText(event.target.value);
          }}
          value={rootPathText}
        />
        <Input
          label="Filter field"
          onChange={(event) => {
            setFilterField(event.target.value);
          }}
          value={filterField}
        />
        <Select
          label="Filter operator"
          onChange={(event) => {
            setFilterOperator(event.target.value as FilterOperator);
          }}
          options={OPERATORS}
          value={filterOperator}
        />
        <Input
          label="Filter value"
          onChange={(event) => {
            setFilterValue(event.target.value);
          }}
          value={filterValue}
        />
        <Input
          label="Sort field"
          onChange={(event) => {
            setSortField(event.target.value);
          }}
          value={sortField}
        />
        <Select
          label="Sort direction"
          onChange={(event) => {
            setSortDirection(event.target.value as "asc" | "desc");
          }}
          options={[
            { label: "Ascending", value: "asc" },
            { label: "Descending", value: "desc" },
          ]}
          value={sortDirection}
        />
        <Input
          label="Pick fields (comma-separated)"
          onChange={(event) => {
            setPickFields(event.target.value);
          }}
          value={pickFields}
        />
        <Input
          label="Limit"
          onChange={(event) => {
            setLimit(event.target.value);
          }}
          value={limit}
        />
      </div>
      <div className={styles.actions}>
        <Button
          onClick={() => {
            runPromise(previewTransform(program));
          }}
          variant="secondary"
        >
          Preview
        </Button>
        <Button
          disabled={state.json === undefined}
          onClick={() => {
            runPromise(applyTransform(program));
          }}
          variant="primary"
        >
          Apply
        </Button>
      </div>
      <pre className={styles.preview}>
        {state.transformPreview ?? "Preview appears here."}
      </pre>
    </aside>
  );
}

/**
 * Parses a filter value from the form as JSON when possible.
 * @param text Raw form text.
 * @returns Parsed JSON value or string.
 */
function parseFilterValue(text: string) {
  try {
    return JSON.parse(text) as string | number | boolean | null;
  } catch {
    return text;
  }
}
