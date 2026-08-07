import { JsonFormatter } from "@json-editor/core/format/json-formatter.js";
import { JsonParser } from "@json-editor/core/parse/json-parser.js";
import { TransformEngine } from "@json-editor/core/query/transform-engine.js";
import { JsonRepairer } from "@json-editor/core/repair/json-repairer.js";
import { SchemaValidator } from "@json-editor/core/validate/schema-validator.js";
import type {
  WorkerJob,
  WorkerRequest,
  WorkerResponse,
} from "@json-editor/core/worker/protocol.js";

const parser = new JsonParser();
const formatter = new JsonFormatter();
const repairer = new JsonRepairer();
const transformEngine = new TransformEngine();

type JobHandlers = {
  [K in WorkerJob["type"]]: (
    id: string,
    job: Extract<WorkerJob, { type: K }>,
  ) => WorkerResponse;
};

const handlers: JobHandlers = {
  format(id, job) {
    const text =
      job.mode === "compact"
        ? formatter.compact(job.value)
        : formatter.beautify(job.value, job.spaces ?? 2);
    return {
      id,
      ok: true,
      result: { text, type: "format" },
    };
  },
  parse(id, job) {
    const result = parser.parse(job.text);
    if (!result.ok) {
      return {
        error: result.error.message,
        id,
        ok: false,
        parseError: result.error,
      };
    }
    return {
      id,
      ok: true,
      result: { type: "parse", value: result.value },
    };
  },
  repair(id, job) {
    const result = repairer.repair(job.text);
    if (!result.ok) {
      return { error: result.message, id, ok: false };
    }
    return {
      id,
      ok: true,
      result: { text: result.text, type: "repair" },
    };
  },
  transform(id, job) {
    const result = transformEngine.apply(job.value, job.program);
    if (!result.ok) {
      return { error: result.message, id, ok: false };
    }
    return {
      id,
      ok: true,
      result: { type: "transform", value: result.value },
    };
  },
  validate(id, job) {
    if (!job.schema) {
      return {
        id,
        ok: true,
        result: { issues: [], type: "validate" },
      };
    }
    const validator = new SchemaValidator(job.schema);
    return {
      id,
      ok: true,
      result: {
        issues: validator.validate(job.value),
        type: "validate",
      },
    };
  },
};

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { id, job } = event.data;
  const response = handleJob(id, job);
  self.postMessage(response);
};

/**
 * Executes a single worker job.
 * @param id Request id.
 * @param job Job payload.
 * @returns Response envelope.
 */
function handleJob(id: string, job: WorkerJob): WorkerResponse {
  try {
    return runHandler(job.type, id, job);
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause.message : String(cause),
      id,
      ok: false,
    };
  }
}

/**
 * Dispatches a typed worker job to its handler.
 * @param type Job discriminant.
 * @param id Request id.
 * @param job Job payload matching `type`.
 * @returns Response envelope.
 */
function runHandler<K extends WorkerJob["type"]>(
  type: K,
  id: string,
  job: Extract<WorkerJob, { type: K }>,
): WorkerResponse {
  return handlers[type](id, job);
}
