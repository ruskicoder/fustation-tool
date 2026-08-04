/**
 * panelCollision.ts
 * Axis-Aligned Bounding Box (AABB) collision detection and push-out resolution
 * for the main panel and viewer panel, ensuring they never overlap.
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Returns true when rectangle A and rectangle B overlap. */
export function rectsOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.w <= b.x ||
    a.x >= b.x + b.w ||
    a.y + a.h <= b.y ||
    a.y >= b.y + b.h
  );
}

/**
 * Given a `moving` rect that just ended a gesture and a `fixed` stationary rect,
 * returns a new position for `moving` that no longer overlaps `fixed`.
 *
 * Strategy: translate `moving` along the axis with the **smallest penetration depth**
 * (shortest push-out), then re-clamp to the viewport.
 */
export function resolveCollision(
  moving: Rect,
  fixed: Rect,
  vw: number,
  vh: number
): Rect {
  if (!rectsOverlap(moving, fixed)) return moving;

  // Compute penetration depths along each cardinal axis.
  const overlapRight  = moving.x + moving.w - fixed.x;   // push moving LEFT
  const overlapLeft   = fixed.x + fixed.w - moving.x;    // push moving RIGHT
  const overlapBottom = moving.y + moving.h - fixed.y;   // push moving UP
  const overlapTop    = fixed.y + fixed.h - moving.y;    // push moving DOWN

  // Find the axis with the minimum penetration.
  const minOverlap = Math.min(overlapRight, overlapLeft, overlapBottom, overlapTop);

  let { x, y } = moving;

  if (minOverlap === overlapRight) {
    x = fixed.x - moving.w;
  } else if (minOverlap === overlapLeft) {
    x = fixed.x + fixed.w;
  } else if (minOverlap === overlapBottom) {
    y = fixed.y - moving.h;
  } else {
    y = fixed.y + fixed.h;
  }

  // Re-clamp so the pushed panel stays fully inside the viewport.
  x = Math.max(8, Math.min(x, vw - moving.w - 8));
  y = Math.max(8, Math.min(y, vh - moving.h - 8));

  return { x, y, w: moving.w, h: moving.h };
}
