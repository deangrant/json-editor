// @vitest-environment happy-dom

import { afterEach, describe, expect, it, vi } from "vitest";

import { openJsonFile } from "./file-io.js";

describe("openJsonFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    Reflect.deleteProperty(window, "showOpenFilePicker");
  });

  it("returns undefined on File System Access AbortError", async () => {
    Object.defineProperty(window, "showOpenFilePicker", {
      configurable: true,
      value: vi
        .fn()
        .mockRejectedValue(new DOMException("Aborted", "AbortError")),
    });

    await expect(openJsonFile()).resolves.toBeUndefined();
  });

  it("returns undefined when the picker yields no handles", async () => {
    Object.defineProperty(window, "showOpenFilePicker", {
      configurable: true,
      value: vi.fn().mockResolvedValue([]),
    });

    await expect(openJsonFile()).resolves.toBeUndefined();
  });

  it("returns undefined when the input cancel event fires", async () => {
    Reflect.deleteProperty(window, "showOpenFilePicker");
    const click = vi
      .spyOn(HTMLInputElement.prototype, "click")
      .mockImplementation(function mockClick(this: HTMLInputElement) {
        this.dispatchEvent(new Event("cancel"));
      });

    await expect(openJsonFile()).resolves.toBeUndefined();
    expect(click).toHaveBeenCalledOnce();
  });

  it("returns undefined on empty input change", async () => {
    Reflect.deleteProperty(window, "showOpenFilePicker");
    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(
      function mockClick(this: HTMLInputElement) {
        Object.defineProperty(this, "files", {
          configurable: true,
          value: [],
        });
        this.dispatchEvent(new Event("change"));
      },
    );

    await expect(openJsonFile()).resolves.toBeUndefined();
  });

  it("settles once via focus fallback when the dialog is dismissed", async () => {
    Reflect.deleteProperty(window, "showOpenFilePicker");
    vi.useFakeTimers();
    vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() => {
      /* dialog opens; no selection */
    });

    const pending = openJsonFile();
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(300);
    await expect(pending).resolves.toBeUndefined();

    // A second focus must not settle again / throw.
    window.dispatchEvent(new Event("focus"));
    await vi.advanceTimersByTimeAsync(300);
    await expect(pending).resolves.toBeUndefined();
  });
});
