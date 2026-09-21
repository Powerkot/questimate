export type TableMode = "round" | "long" | "hall";

export type TableSeatPosition = {
  left: string;
  top: string;
};

const ROUND_SEAT_POSITIONS: Record<number, Array<[number, number]>> = {
  1: [[50, 76]],
  2: [
    [24, 53],
    [76, 53],
  ],
  3: [
    [50, 20],
    [25, 72],
    [75, 72],
  ],
  4: [
    [27, 24],
    [73, 24],
    [27, 76],
    [73, 76],
  ],
  5: [
    [50, 18],
    [21, 39],
    [29, 78],
    [71, 78],
    [79, 39],
  ],
  6: [
    [50, 17],
    [21, 35],
    [21, 72],
    [50, 83],
    [79, 72],
    [79, 35],
  ],
};

export function tableLayoutMode(playerCount: number): TableMode {
  if (playerCount <= 6) return "round";
  if (playerCount <= 12) return "long";
  return "hall";
}

function rowPosition(index: number, count: number): number {
  if (count <= 1) return 50;
  return 13 + (index * 74) / (count - 1);
}

export function tableSeatPosition(
  index: number,
  count: number,
  mode: TableMode,
): TableSeatPosition | undefined {
  if (mode === "hall") return undefined;
  if (mode === "round") {
    const [left, top] = ROUND_SEAT_POSITIONS[count]?.[index] ?? [50, 50];
    return { left: `${left}%`, top: `${top}%` };
  }

  const topCount = Math.ceil(count / 2);
  const isTop = index < topCount;
  const rowIndex = isTop ? index : index - topCount;
  const rowCount = isTop ? topCount : count - topCount;
  return {
    left: `${rowPosition(rowIndex, rowCount)}%`,
    top: isTop ? "26%" : "74%",
  };
}
