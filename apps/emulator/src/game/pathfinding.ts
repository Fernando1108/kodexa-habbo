type Grid = (number | null)[][];

interface Node {
  x:      number;
  y:      number;
  g:      number;
  h:      number;
  f:      number;
  parent: Node | null;
}

const DIRS = [
  [0, -1], [1, -1], [1, 0], [1, 1],
  [0,  1], [-1, 1], [-1, 0], [-1, -1],
] as const;

const DIAGONAL_COST = 1.414;

function heuristic(x: number, y: number, ex: number, ey: number): number {
  return Math.max(Math.abs(x - ex), Math.abs(y - ey)); // Chebyshev
}

function isWalkable(grid: Grid, x: number, y: number): boolean {
  if (y < 0 || y >= grid.length)    return false;
  if (x < 0 || x >= grid[y].length) return false;
  return grid[y][x] !== null;
}

export function findPath(
  grid:   Grid,
  startX: number,
  startY: number,
  endX:   number,
  endY:   number,
): { x: number; y: number }[] {
  if (!isWalkable(grid, endX, endY)) return [];
  if (startX === endX && startY === endY) return [];

  const open: Node[]       = [];
  const closed = new Set<string>();
  const key = (x: number, y: number) => `${x},${y}`;
  const openMap = new Map<string, Node>();

  const startNode: Node = {
    x: startX, y: startY,
    g: 0,
    h: heuristic(startX, startY, endX, endY),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  open.push(startNode);
  openMap.set(key(startX, startY), startNode);

  while (open.length > 0) {
    // Pop node with lowest f
    let lowestIdx = 0;
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[lowestIdx].f) lowestIdx = i;
    }
    const current = open.splice(lowestIdx, 1)[0];
    openMap.delete(key(current.x, current.y));

    if (current.x === endX && current.y === endY) {
      const path: { x: number; y: number }[] = [];
      let node: Node | null = current;
      while (node) {
        path.unshift({ x: node.x, y: node.y });
        node = node.parent;
      }
      return path.slice(1); // exclude start position
    }

    closed.add(key(current.x, current.y));

    for (const [dx, dy] of DIRS) {
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (!isWalkable(grid, nx, ny)) continue;
      if (closed.has(key(nx, ny))) continue;

      // Diagonal: both adjacent cardinals must be walkable
      if (dx !== 0 && dy !== 0) {
        if (!isWalkable(grid, current.x + dx, current.y)) continue;
        if (!isWalkable(grid, current.x, current.y + dy)) continue;
      }

      const g = current.g + (dx !== 0 && dy !== 0 ? DIAGONAL_COST : 1);
      const existing = openMap.get(key(nx, ny));

      if (!existing) {
        const node: Node = {
          x: nx, y: ny,
          g,
          h: heuristic(nx, ny, endX, endY),
          f: 0,
          parent: current,
        };
        node.f = node.g + node.h;
        open.push(node);
        openMap.set(key(nx, ny), node);
      } else if (g < existing.g) {
        existing.g = g;
        existing.f = g + existing.h;
        existing.parent = current;
      }
    }

    // Safety limit
    if (closed.size > 400) break;
  }

  return []; // no path
}
