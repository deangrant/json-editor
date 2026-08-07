/**
 * Runs a promise without leaving an unhandled rejection.
 * @param promise Promise to settle in the background.
 */
export function runPromise(promise: Promise<unknown>): void {
  promise.catch((error: unknown) => {
    console.error(error);
  });
}
