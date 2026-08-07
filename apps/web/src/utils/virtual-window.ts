/**
 * Computes a visible window over a virtualized list.
 * @param scrollTop Current scroll offset in pixels.
 * @param viewportHeight Viewport height in pixels.
 * @param itemCount Total item count.
 * @param itemHeight Fixed item height in pixels.
 * @param overscan Extra rows rendered above/below the viewport.
 * @returns Start index, end index (exclusive), and top offset.
 */
export function getVirtualWindow(
  scrollTop: number,
  viewportHeight: number,
  itemCount: number,
  itemHeight: number,
  overscan = 8,
): { start: number; end: number; offsetY: number } {
  if (itemCount === 0 || itemHeight <= 0) {
    return { end: 0, offsetY: 0, start: 0 };
  }

  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const visible = Math.ceil(viewportHeight / itemHeight) + overscan * 2;
  const end = Math.min(itemCount, start + visible);
  return { end, offsetY: start * itemHeight, start };
}
