import type {
  WorkerJob,
  WorkerRequest,
  WorkerResponse,
} from "@json-editor/core/worker/protocol.js";

interface Pending {
  reject: (error: Error) => void;
  resolve: (response: WorkerResponse) => void;
}

/**
 * Thin client around the JSON web worker.
 */
export class WorkerClient {
  private readonly worker: Worker;
  private readonly pending = new Map<string, Pending>();
  private sequence = 0;

  constructor() {
    this.worker = new Worker(
      new URL("../workers/json-worker.ts", import.meta.url),
      {
        type: "module",
      },
    );
    this.worker.addEventListener(
      "message",
      (event: MessageEvent<WorkerResponse>) => {
        const response = event.data;
        const entry = this.pending.get(response.id);
        if (!entry) {
          return;
        }
        this.pending.delete(response.id);
        entry.resolve(response);
      },
    );
    this.worker.addEventListener("error", (event) => {
      for (const [, entry] of this.pending) {
        entry.reject(new Error(event.message || "Worker failed."));
      }
      this.pending.clear();
    });
  }

  /**
   * Runs a job in the worker and returns the response.
   * @param job Worker job payload.
   * @returns Worker response.
   */
  run(job: WorkerJob): Promise<WorkerResponse> {
    this.sequence += 1;
    const id = `job-${this.sequence}`;
    const request: WorkerRequest = { id, job };

    return new Promise((resolve, reject) => {
      this.pending.set(id, { reject, resolve });
      this.worker.postMessage(request);
    });
  }

  /** Terminates the worker. */
  dispose(): void {
    this.worker.terminate();
    this.pending.clear();
  }
}
