export const TABLE_CAPACITY = 6;

export type TableSeatAssignment = {
  playerId: string;
  slot: number;
};

// Slots follow the artwork clockwise: top, upper-right, lower-right,
// bottom, lower-left, upper-left. The viewer is always placed at the
// bottom so the table reads naturally from every participant's screen.
const SLOTS_BY_PLAYER_COUNT: Record<number, number[]> = {
  1: [3],
  2: [0, 3],
  3: [5, 1, 3],
  4: [0, 5, 1, 3],
  5: [5, 1, 4, 2, 3],
  6: [0, 5, 1, 4, 2, 3],
};

export function canUseTable(playerCount: number): boolean {
  return playerCount > 0 && playerCount <= TABLE_CAPACITY;
}

export function tableSeatAssignments(playerIds: string[], viewerId: string): TableSeatAssignment[] {
  if (!canUseTable(playerIds.length)) return [];

  const viewerIndex = playerIds.indexOf(viewerId);
  const ordered =
    viewerIndex === -1
      ? [...playerIds]
      : [...playerIds.slice(0, viewerIndex), ...playerIds.slice(viewerIndex + 1), viewerId];
  const slots = SLOTS_BY_PLAYER_COUNT[ordered.length];

  return ordered.map((playerId, index) => ({ playerId, slot: slots[index] }));
}
