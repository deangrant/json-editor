import type {
  FilterOperator,
  TransformOp,
  TransformProgram,
} from "@json-editor/core/query/transform.types.js";
import { type ChangeEvent, useCallback, useMemo, useState } from "react";

import {
  useDocumentState,
  useDocumentTransform,
} from "../../../hooks/use-document.js";
import { runPromise } from "../../../utils/run-promise.js";
import { Button, Input, Select } from "../../core/index.js";
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
  const { state } = useDocumentState();
  const { previewTransform, applyTransform } = useDocumentTransform();
  const [rootPathText, setRootPathText] = useState("items");
  const [filterField, setFilterField] = useState("active");
  const [filterOperator, setFilterOperator] = useState<FilterOperator>("eq");
  const [filterValue, setFilterValue] = useState("true");
  const [sortField, setSortField] = useState("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [pickFields, setPickFields] = useState("id,name,active");
  const [mapRenames, setMapRenames] = useState("");
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
    const renames = parseMapRenames(mapRenames);
    if (renames.length > 0) {
      ops.push({ renames, type: "map" });
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
    mapRenames,
    pickFields,
    rootPathText,
    sortDirection,
    sortField,
  ]);

  const handleRootPathChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setRootPathText(event.target.value);
    },
    [],
  );

  const handleFilterFieldChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilterField(event.target.value);
    },
    [],
  );

  const handleFilterOperatorChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setFilterOperator(event.target.value as FilterOperator);
    },
    [],
  );

  const handleFilterValueChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setFilterValue(event.target.value);
    },
    [],
  );

  const handleSortFieldChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setSortField(event.target.value);
    },
    [],
  );

  const handleSortDirectionChange = useCallback(
    (event: ChangeEvent<HTMLSelectElement>) => {
      setSortDirection(event.target.value as "asc" | "desc");
    },
    [],
  );

  const handlePickFieldsChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setPickFields(event.target.value);
    },
    [],
  );

  const handleMapRenamesChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setMapRenames(event.target.value);
    },
    [],
  );

  const handleLimitChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      setLimit(event.target.value);
    },
    [],
  );

  const handlePreview = useCallback(() => {
    runPromise(previewTransform(program));
  }, [previewTransform, program]);

  const handleApply = useCallback(() => {
    runPromise(applyTransform(program));
  }, [applyTransform, program]);

  return (
    <aside className={styles.panel}>
      <h2 className={styles.title}>Transform</h2>
      <p className={styles.help}>
        Built-in filter → sort → pick → map → limit pipeline on an array path.
      </p>
      <div className={styles.grid}>
        <Input
          label="Root path"
          onChange={handleRootPathChange}
          value={rootPathText}
        />
        <Input
          label="Filter field"
          onChange={handleFilterFieldChange}
          value={filterField}
        />
        <Select
          label="Filter operator"
          onChange={handleFilterOperatorChange}
          options={OPERATORS}
          value={filterOperator}
        />
        <Input
          label="Filter value"
          onChange={handleFilterValueChange}
          value={filterValue}
        />
        <Input
          label="Sort field"
          onChange={handleSortFieldChange}
          value={sortField}
        />
        <Select
          label="Sort direction"
          onChange={handleSortDirectionChange}
          options={[
            { label: "Ascending", value: "asc" },
            { label: "Descending", value: "desc" },
          ]}
          value={sortDirection}
        />
        <Input
          label="Pick fields (comma-separated)"
          onChange={handlePickFieldsChange}
          value={pickFields}
        />
        <Input
          label="Map renames (from:to, …)"
          onChange={handleMapRenamesChange}
          value={mapRenames}
        />
        <Input label="Limit" onChange={handleLimitChange} value={limit} />
      </div>
      <div className={styles.actions}>
        <Button onClick={handlePreview} variant="secondary">
          Preview
        </Button>
        <Button
          disabled={state.json === undefined}
          onClick={handleApply}
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

/**
 * Parses comma-separated `from:to` rename pairs, skipping malformed entries.
 * @param text Raw form text.
 * @returns Valid rename pairs.
 */
function parseMapRenames(
  text: string,
): { readonly from: string; readonly to: string }[] {
  return text
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .flatMap((part) => {
      const separator = part.indexOf(":");
      if (separator <= 0 || separator === part.length - 1) {
        return [];
      }
      const from = part.slice(0, separator).trim();
      const to = part.slice(separator + 1).trim();
      if (!(from && to)) {
        return [];
      }
      return [{ from, to }];
    });
}
