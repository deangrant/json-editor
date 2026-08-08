import type {
  WorkerJob,
  WorkerRequest,
  WorkerResponse,
} from "@json-editor/core/worker/protocol.js";

/** Rejects stuck worker jobs so UI busy flags can clear. */
const JOB_TIMEOUT_MS = 30_000;

interface Pending {
  reject: (error: Error) => void;
  resolve: (response: WorkerResponse) => void;
  timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Thin client around the JSON web worker.
 */
export class WorkerClient {
  // `null` means disposed (terminal). `undefined` means no live worker yet / after crash.
  private worker: Worker | null | undefined;
  private readonly pending = new Map<string, Pending>();
  private sequence = 0;

  constructor() {
    this.attachWorker();
  }

  /**
   * Runs a job in the worker and returns the response.
   * @param job Worker job payload.
   * @returns Worker response.
   */
  run(job: WorkerJob): Promise<WorkerResponse> {
    const { worker } = this;
    if (worker === null || worker === undefined) {
      return Promise.reject(new Error("Worker disposed."));
    }

    this.sequence += 1;
    const id = `job-${this.sequence}`;
    const request: WorkerRequest = { id, job };

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        if (!this.pending.has(id)) {
          return;
        }
        this.pending.delete(id);
        reject(new Error("Worker job timed out."));
      }, JOB_TIMEOUT_MS);

      this.pending.set(id, {
        reject: (error) => {
          clearTimeout(timeoutId);
          reject(error);
        },
        resolve: (response) => {
          clearTimeout(timeoutId);
          resolve(response);
        },
        timeoutId,
      });
      worker.postMessage(request);
    });
  }

  /**
   * Terminates the worker and rejects any in-flight jobs.
   */
  dispose(): void {
    if (this.worker === null) {
      return;
    }
    const { worker } = this;
    this.worker = null;
    this.rejectAll(new Error("Worker disposed."));
    worker?.terminate();
  }

  /**
   * Creates the worker and wires message/error handlers.
   */
  private attachWorker(): void {
    if (this.worker === null) {
      return;
    }

    const worker = new Worker(
      new URL("../workers/json-worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    this.worker = worker;

    worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        const entry = this.pending.get(response.id);
        if (!entry) {
          return;
        }
        this.pending.delete(response.id);
        clearTimeout(entry.timeoutId);
        entry.resolve(response);
      },
    );

    worker.addEventListener("error", (event) => {
      const message = event.message || "unknown error";
      this.rejectAll(new Error(`Worker crashed: ${message}`));
      worker.terminate();
      if (this.worker === worker) {
        this.worker = undefined;
      }
      if (this.worker !== null) {
        this.attachWorker();
      }
    });
  }

  /**
   * Rejects and clears all pending jobs.
   * @param error Rejection error for waiters.
   */
  private rejectAll(error: Error): void {
    for (const entry of this.pending.values()) {
      clearTimeout(entry.timeoutId);
      entry.reject(error);
    }
    this.pending.clear();
  }
}
