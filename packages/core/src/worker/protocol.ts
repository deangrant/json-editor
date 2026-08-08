import type { TransformProgram } from "../query/transform.types.js";
import type {
  JsonValue,
  ParseError,
  ValidationIssue,
} from "../types/json.types.js";

/** Jobs the JSON worker can execute. */
export type WorkerJob =
  | { readonly type: "parse"; readonly text: string }
  | { readonly type: "repair"; readonly text: string }
  | {
      readonly type: "format";
      readonly value: JsonValue;
      readonly mode: "beautify" | "compact";
      readonly spaces?: number;
    }
  | {
      readonly type: "validate";
      readonly value: JsonValue;
      readonly schema?: object;
    }
  | {
      readonly type: "transform";
      readonly value: JsonValue;
      readonly program: TransformProgram;
    };

/** Request envelope sent to the worker. */
export interface WorkerRequest {
  /** Correlation id matched on the response. */
  readonly id: string;
  /** Job payload executed by the worker. */
  readonly job: WorkerJob;
}

/** Successful or failed worker response. */
export type WorkerResponse =
  | {
      readonly id: string;
      readonly ok: true;
      readonly result:
        | { readonly type: "parse"; readonly value: JsonValue }
        | { readonly type: "repair"; readonly text: string }
        | { readonly type: "format"; readonly text: string }
        | { readonly type: "validate"; readonly issues: ValidationIssue[] }
        | { readonly type: "transform"; readonly value: JsonValue };
    }
  | {
      readonly id: string;
      readonly ok: false;
      readonly error: string;
      readonly parseError?: ParseError;
    };
