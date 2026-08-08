import type {
  WorkerRequest,
  WorkerResponse,
} from "@json-editor/core/worker/protocol.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorkerClient } from "./worker-client.js";

type MessageHandler = (event: MessageEvent<WorkerResponse>) => void;
type ErrorHandler = (event: ErrorEvent) => void;

class FakeWorker {
  static instances: FakeWorker[] = [];

  readonly listeners = {
    error: new Set<ErrorHandler>(),
    message: new Set<MessageHandler>(),
  };

  constructor(_url: URL | string, _options?: WorkerOptions) {
    FakeWorker.instances.push(this);
  }

  addEventListener(
    type: "message" | "error",
    listener: MessageHandler | ErrorHandler,
  ): void {
    if (type === "message") {
      this.listeners.message.add(listener as MessageHandler);
      return;
    }
    this.listeners.error.add(listener as ErrorHandler);
  }

  postMessage(request: WorkerRequest): void {
    const response: WorkerResponse = {
      id: request.id,
      ok: true,
      result: { type: "parse", value: { id: request.id } },
    };
    queueMicrotask(() => {
      for (const listener of this.listeners.message) {
        listener({ data: response } as MessageEvent<WorkerResponse>);
      }
    });
  }

  terminate(): void {
    this.listeners.message.clear();
    this.listeners.error.clear();
  }

  emitError(message: string): void {
    for (const listener of this.listeners.error) {
      listener({ message } as ErrorEvent);
    }
  }
}

describe("WorkerClient", () => {
  const originalWorker = globalThis.Worker;

  beforeEach(() => {
    FakeWorker.instances = [];
    vi.stubGlobal("Worker", FakeWorker);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    globalThis.Worker = originalWorker;
  });

  it("correlates responses by request id", async () => {
    const client = new WorkerClient();
    const response = await client.run({ text: "{}", type: "parse" });
    expect(response).toEqual({
      id: "job-1",
      ok: true,
      result: { type: "parse", value: { id: "job-1" } },
    });
    client.dispose();
  });

  it("rejects pending jobs on dispose", async () => {
    const client = new WorkerClient();
    const worker = FakeWorker.instances.at(-1);
    if (!worker) {
      throw new Error("expected FakeWorker");
    }
    worker.postMessage = () => {
      /* leave pending */
    };

    const pending = client.run({ text: "{}", type: "parse" });
    client.dispose();
    await expect(pending).rejects.toThrow("Worker disposed.");
  });

  it("rejects pending jobs on error and recreates the worker", async () => {
    const client = new WorkerClient();
    expect(FakeWorker.instances).toHaveLength(1);
    const [first] = FakeWorker.instances;
    if (!first) {
      throw new Error("expected FakeWorker");
    }
    first.postMessage = () => {
      /* leave pending until error */
    };

    const pending = client.run({ text: "{}", type: "parse" });
    first.emitError("boom");
    await expect(pending).rejects.toThrow("Worker crashed: boom");
    expect(FakeWorker.instances).toHaveLength(2);

    const recovered = await client.run({ text: "{}", type: "parse" });
    expect(recovered.id).toBe("job-2");
    client.dispose();
  });

  it("resolves overlapping jobs independently", async () => {
    const client = new WorkerClient();
    const worker = FakeWorker.instances.at(-1);
    if (!worker) {
      throw new Error("expected FakeWorker");
    }

    const responses = new Map<string, WorkerResponse>();
    worker.postMessage = (request: WorkerRequest) => {
      responses.set(request.id, {
        id: request.id,
        ok: true,
        result: {
          type: "parse",
          value: { echo: (request.job as { text: string }).text },
        },
      });
    };

    const first = client.run({ text: "1", type: "parse" });
    const second = client.run({ text: "2", type: "parse" });

    queueMicrotask(() => {
      for (const response of responses.values()) {
        for (const listener of worker.listeners.message) {
          listener({ data: response } as MessageEvent<WorkerResponse>);
        }
      }
    });

    await expect(Promise.all([first, second])).resolves.toEqual([
      {
        id: "job-1",
        ok: true,
        result: { type: "parse", value: { echo: "1" } },
      },
      {
        id: "job-2",
        ok: true,
        result: { type: "parse", value: { echo: "2" } },
      },
    ]);
    client.dispose();
  });
});
