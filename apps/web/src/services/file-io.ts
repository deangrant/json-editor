/**
 * Opens a local JSON file using the File System Access API when available,
 * falling back to an `<input type="file">` picker.
 * @returns File text and name, or `undefined` if the user cancels.
 */
export async function openJsonFile(): Promise<
  { text: string; fileName: string } | undefined
> {
  if ("showOpenFilePicker" in window) {
    try {
      const handles = await window.showOpenFilePicker({
        multiple: false,
        types: [
          {
            accept: { "application/json": [".json"] },
            description: "JSON",
          },
        ],
      });
      const [handle] = handles;
      if (!handle) {
        return;
      }
      const file = await handle.getFile();
      return { fileName: file.name, text: await file.text() };
    } catch (cause) {
      if (isAbortError(cause)) {
        return;
      }
      throw cause;
    }
  }

  return openWithInputElement();
}

/**
 * Saves text as a downloadable JSON file.
 * @param text Document text.
 * @param fileName Suggested file name.
 */
export function saveJsonFile(text: string, fileName = "document.json"): void {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName.endsWith(".json") ? fileName : `${fileName}.json`;
  anchor.click();
  // Delay revoke so browsers that start the download asynchronously still have a live URL.
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}

/**
 * Fallback file picker using a hidden input element.
 * @returns File text and name, or `undefined` if cancelled.
 */
function openWithInputElement(): Promise<
  { text: string; fileName: string } | undefined
> {
  return new Promise((resolve) => {
    let settled = false;
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";

    const settle = (
      value: { text: string; fileName: string } | undefined,
    ): void => {
      if (settled) {
        return;
      }
      settled = true;
      window.removeEventListener("focus", onWindowFocus);
      resolve(value);
    };

    const onWindowFocus = (): void => {
      // Some browsers omit `cancel` when the dialog is dismissed; after focus
      // returns, treat a missing selection as cancel.
      window.setTimeout(() => {
        if (!input.files?.length) {
          settle(undefined);
        }
      }, 300);
    };

    input.addEventListener("change", () => {
      const file = input.files?.[0];
      if (!file) {
        settle(undefined);
        return;
      }
      file
        .text()
        .then((text) => {
          settle({ fileName: file.name, text });
        })
        .catch((error: unknown) => {
          console.error(error);
          settle(undefined);
        });
    });
    input.addEventListener("cancel", () => {
      settle(undefined);
    });
    window.addEventListener("focus", onWindowFocus, { once: true });
    input.click();
  });
}

/**
 * Detects user-cancelled picker errors.
 * @param cause Unknown thrown value.
 * @returns Whether the error is an abort.
 */
function isAbortError(cause: unknown): boolean {
  return cause instanceof DOMException && cause.name === "AbortError";
}

declare global {
  interface Window {
    showOpenFilePicker?: (options?: {
      types?: {
        description?: string;
        accept: Record<string, string[]>;
      }[];
      multiple?: boolean;
    }) => Promise<FileSystemFileHandle[]>;
  }
}
