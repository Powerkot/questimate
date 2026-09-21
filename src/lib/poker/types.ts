export const SCALE = ["xs", "s", "m", "l", "xl", "XXL", "?", "☕"] as const;
export type CardValue = (typeof SCALE)[number];

export const SIZE_RANK: Record<string, number> = {
  xs: 1,
  s: 2,
  m: 3,
  l: 4,
  xl: 5,
  XXL: 6,
};

export const RANK_SIZE: Record<number, CardValue> = {
  1: "xs",
  2: "s",
  3: "m",
  4: "l",
  5: "xl",
  6: "XXL",
};

export type ChatKind = "say" | "system" | "snow";

export type ChatEntry = {
  id: string;
  kind: ChatKind;
  fromId?: string;
  from?: string;
  targetId?: string;
  target?: string;
  text: string;
  textEn?: string;
  ts: number;
};

export type HistoryEntry = {
  id: string;
  title: string;
  description: string;
  result: string;
  votes: { name: string; value: string }[];
  ts: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
};

export type StoredPlayer = {
  id: string;
  name: string;
  token: string;
  lastSeen: number;
  bot?: boolean;
  joinedAt?: number;
};

export type StoredRoom = {
  code: string;
  hostId: string;
  players: StoredPlayer[];
  task: Task | null;
  votes: Record<string, CardValue>;
  revealed: boolean;
  history: HistoryEntry[];
  chat: ChatEntry[];
  snowUntil: Record<string, number>;
  demoHit?: Record<string, boolean>;
};

export type PublicPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  voted: boolean;
  vote: CardValue | null;
  snowUntil: number;
};

export type Snapshot = {
  code: string;
  hostId: string;
  players: PublicPlayer[];
  task: Task | null;
  revealed: boolean;
  votesCount: number;
  scale: readonly CardValue[];
  history: HistoryEntry[];
  chat: ChatEntry[];
};

export type PokerOk = { ok: true; you: string; state: Snapshot };
export type PokerErr = { ok: false; error: "room_not_found" | "unauthorized" | "invalid" };
export type PokerResult = PokerOk | PokerErr;
