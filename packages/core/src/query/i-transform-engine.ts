import type { JsonValue } from "../types/json.types.js";
import type { TransformProgram, TransformResult } from "./transform.types.js";

/**
 * Applies built-in transform DSL programs to JSON documents.
 */
export interface ITransformEngine {
  /**
   * Applies `program` and returns the full updated document.
   * @param root Document root.
   * @param program Transform program.
   * @returns Updated root, or an error message.
   */
  apply: (root: JsonValue, program: TransformProgram) => TransformResult;

  /**
   * Previews the value at `program.rootPath` after ops (without writing back).
   * @param root Document root.
   * @param program Transform program.
   * @returns Transformed subtree, or an error message.
   */
  preview: (root: JsonValue, program: TransformProgram) => TransformResult;
}
