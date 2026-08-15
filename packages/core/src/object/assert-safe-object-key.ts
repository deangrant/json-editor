/**
 * Rejects object keys that would pollute `Object.prototype` via assignment.
 * @param key Candidate object property name.
 * @throws If `key` is `__proto__`, `constructor`, or `prototype`.
 */
export function assertSafeObjectKey(key: string): void {
  if (key === "__proto__" || key === "constructor" || key === "prototype") {
    throw new Error(`Unsafe object key "${key}".`);
  }
}
