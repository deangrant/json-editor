import { jsonrepair } from "jsonrepair";

import type { IJsonRepairer, RepairResult } from "./i-json-repairer.js";

/**
 * Repairs invalid JSON using the `jsonrepair` library.
 */
export class JsonRepairer implements IJsonRepairer {
  /**
   * Attempts to repair `text`.
   * @param text Possibly invalid JSON text.
   * @returns Repaired text, or a failure message.
   */
  repair(text: string): RepairResult {
    try {
      return { ok: true, text: jsonrepair(text) };
    } catch (cause) {
      return {
        message: cause instanceof Error ? cause.message : String(cause),
        ok: false,
      };
    }
  }
}
