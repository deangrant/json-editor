import type { JsonValue } from "@json-editor/core/types/json.types.js";

/** Default document shown on first load. */
export const DEFAULT_DOCUMENT: JsonValue = {
  color: "#0b6e6a",
  createdAt: 1_700_000_000,
  greeting: "Hello World",
  items: [
    { active: true, id: 1, name: "Ada" },
    { active: false, id: 2, name: "Grace" },
    { active: true, id: 3, name: "Alan" },
  ],
};

/** Editor view modes. */
export const EDITOR_MODES = ["tree", "text", "table"] as const;

/** Side panel identifiers. */
export const SIDE_PANELS = ["none", "schema", "transform"] as const;
