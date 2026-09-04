/**
 * Fractional indexing for Kanban card order. Each task stores a float
 * `order`; inserting a card between two neighbors just needs the midpoint,
 * so drag-and-drop reorders never require rewriting every sibling row.
 */
const GAP = 1000;

export function orderAtStart(firstExistingOrder?: number): number {
  if (firstExistingOrder === undefined) return GAP;
  return firstExistingOrder - GAP;
}

export function orderAtEnd(lastExistingOrder?: number): number {
  if (lastExistingOrder === undefined) return GAP;
  return lastExistingOrder + GAP;
}

export function orderBetween(before: number | undefined, after: number | undefined): number {
  if (before === undefined && after === undefined) return GAP;
  if (before === undefined) return (after as number) - GAP;
  if (after === undefined) return before + GAP;
  return (before + after) / 2;
}
