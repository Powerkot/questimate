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

export type HistoryVote = {
  name: string;
  value: string;
  variantId?: string;
};

export type HistoryRound = {
  id: string;
  votes: HistoryVote[];
  ts: number;
};

export type HistoryEntry = {
  id: string;
  title: string;
  description: string;
  result: string;
  resultVariantId?: string;
  votes: HistoryVote[];
  startedAt?: number;
  finalizedBy?: string;
  decisionNote?: string;
  rounds?: HistoryRound[];
  ts: number;
};

export type Task = {
  id: string;
  title: string;
  description: string;
  startedAt?: number;
};

export type StoredPlayer = {
  id: string;
  name: string;
  token: string;
  lastSeen: number;
  bot?: boolean;
  joinedAt?: number;
  leftAt?: number;
  lastLeaveNoticeAt?: number;
  kickedAt?: number;
};

export type RoomPassword = {
  salt: string;
  hash: string;
};

export type StoredRoom = {
  code: string;
  cardBackId: string;
  password?: RoomPassword;
  hostId: string;
  players: StoredPlayer[];
  task: Task | null;
  votes: Record<string, CardValue>;
  roundId: string;
  variants: Record<string, string>;
  revealed: boolean;
  history: HistoryEntry[];
  completedRounds?: HistoryRound[];
  queue?: Task[];
  chat: ChatEntry[];
  snowUntil: Record<string, number>;
  demoHit?: Record<string, boolean>;
  demoVotingAt?: number;
};

export type PublicPlayer = {
  id: string;
  name: string;
  isHost: boolean;
  online: boolean;
  voted: boolean;
  vote: CardValue | null;
  variantId: string | null;
  snowUntil: number;
};

export type Snapshot = {
  code: string;
  passwordProtected: boolean;
  cardBackId: string;
  hostId: string;
  players: PublicPlayer[];
  task: Task | null;
  revealed: boolean;
  roundId: string;
  queue: Task[];
  deckVariants: Record<CardValue, string>;
  votesCount: number;
  scale: readonly CardValue[];
  history: HistoryEntry[];
  chat: ChatEntry[];
};

export type PokerOk = { ok: true; you: string; state: Snapshot };
export type PokerErr = {
  ok: false;
  error: "room_not_found" | "password_required" | "wrong_password" | "unauthorized" | "invalid";
};
export type PokerResult = PokerOk | PokerErr;
