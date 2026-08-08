import type { IJsonFormatter } from "@json-editor/core/format/i-json-formatter.js";
import { JsonFormatter } from "@json-editor/core/format/json-formatter.js";
import { HistoryStack } from "@json-editor/core/history/history-stack.js";
import type { IHistoryStack } from "@json-editor/core/history/i-history-stack.js";
import type { IJsonParser } from "@json-editor/core/parse/i-json-parser.js";
import { JsonParser } from "@json-editor/core/parse/json-parser.js";
import type { ITransformEngine } from "@json-editor/core/query/i-transform-engine.js";
import { TransformEngine } from "@json-editor/core/query/transform-engine.js";
import type {
  WorkerJob,
  WorkerResponse,
} from "@json-editor/core/worker/protocol.js";

import { openJsonFile, saveJsonFile } from "../../services/file-io.js";
import { WorkerClient } from "../../services/worker-client.js";
import type { DocumentSnapshot } from "../../types/document.types.js";

/** Narrow worker surface used by the document controller. */
export interface WorkerPort {
  /** Terminates the worker and rejects in-flight jobs. */
  dispose: () => void;
  /** Runs a worker job and returns its response. */
  run: (job: WorkerJob) => Promise<WorkerResponse>;
}

/** Narrow file I/O surface used by the document controller. */
export interface FileIoPort {
  /** Opens a local JSON file, or returns `undefined` when cancelled. */
  openJsonFile: () => Promise<{ text: string; fileName: string } | undefined>;
  /** Saves document text as a downloadable JSON file. */
  saveJsonFile: (text: string, fileName?: string) => void;
}

/** Injected collaborators for {@link useDocumentController}. */
export interface DocumentControllerDeps {
  /** Creates the undo/redo history stack. */
  createHistory: () => IHistoryStack<DocumentSnapshot>;
  /** Creates a JSON parser for schema text. */
  createParser: () => IJsonParser;
  /** Creates the worker port used for parse/format/validate jobs. */
  createWorker: () => WorkerPort;
  /** File open/save adapter. */
  fileIo: FileIoPort;
  /** JSON formatter used for local format/setJson paths. */
  formatter: IJsonFormatter;
  /** Transform engine used for local apply/preview fallbacks. */
  transformEngine: ITransformEngine;
}

/**
 * Builds the default production dependency graph for the document controller.
 * @returns Concrete adapters wired for browser use.
 */
export function createDefaultDocumentControllerDeps(): DocumentControllerDeps {
  return {
    createHistory: () => new HistoryStack<DocumentSnapshot>(100),
    createParser: () => new JsonParser(),
    createWorker: () => new WorkerClient(),
    fileIo: { openJsonFile, saveJsonFile },
    formatter: new JsonFormatter(),
    transformEngine: new TransformEngine(),
  };
}
