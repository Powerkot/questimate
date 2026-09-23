import {
  SCALE,
  type CardValue,
  type ChatEntry,
  type Snapshot,
  type StoredPlayer,
  type StoredRoom,
  type RoomPassword,
} from "./types.ts";
import { cardBackIds, cardVariantIds, DEFAULT_CARD_BACK_ID } from "./cards.ts";
import { analyzeVotes } from "./consensus.ts";

export const DEMO_CODE = "RAID1";
export const DEMO_SNOW_AFTER_MS = 12_000;
export const PRESENCE_AWAY_MS = 30_000;
const PLAYER_RETENTION_MS = 24 * 60 * 60_000;
const HEARTBEAT_WRITE_MS = 15_000;
const LEAVE_NOTICE_COOLDOWN_MS = 60_000;
const CHAT_CAP = 300;

export function now(): number {
  return Date.now();
}

export function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`;
}

export function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(5);
  crypto.getRandomValues(bytes);
  let s = "";
  for (const byte of bytes) s += alphabet[byte % alphabet.length];
  return s;
}

export function isCard(value: unknown): value is CardValue {
  return typeof value === "string" && (SCALE as readonly string[]).includes(value);
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function randomCardBackId(): string {
  const backs = cardBackIds();
  if (!backs.length) return DEFAULT_CARD_BACK_ID;
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return backs[bytes[0] % backs.length];
}

export function selectVariantId(
  room: Pick<StoredRoom, "code" | "task" | "roundId">,
  playerId: string,
  value: CardValue,
): string {
  const pool = cardVariantIds(value);
  const seed = `${room.code}:${room.task?.id ?? "no-task"}:${room.roundId}:${playerId}:${value}`;
  return pool[stableHash(seed) % pool.length];
}

export function normalizeRoom(room: StoredRoom): StoredRoom {
  room.roundId ||= room.task?.id ?? makeId("r");
  room.variants ||= {};
  const backs = cardBackIds();
  if (!backs.includes(room.cardBackId)) {
    room.cardBackId = backs[stableHash(room.code) % backs.length] ?? DEFAULT_CARD_BACK_ID;
  }
  return room;
}

function pushChat(room: StoredRoom, entry: ChatEntry): void {
  room.chat.push(entry);
  if (room.chat.length > CHAT_CAP) room.chat = room.chat.slice(-250);
}

function activePlayers(room: StoredRoom): StoredPlayer[] {
  return room.players.filter((player) => !player.leftAt);
}

export function throwSnowball(room: StoredRoom, from: StoredPlayer, target: StoredPlayer): void {
  const until = now() + 10_000;
  room.snowUntil[target.id] = until;
  pushChat(room, {
    id: makeId("c"),
    kind: "snow",
    fromId: from.id,
    from: from.name,
    targetId: target.id,
    target: target.name,
    text: `${from.name} бросил снежок в ${target.name}.`,
    textEn: `${from.name} threw a snowball at ${target.name}.`,
    ts: now(),
  });
}

export function snapshot(room: StoredRoom, viewerId: string): Snapshot {
  normalizeRoom(room);
  const t = now();
  return {
    code: room.code,
    passwordProtected: Boolean(room.password),
    cardBackId: room.cardBackId,
    hostId: room.hostId,
    players: activePlayers(room).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === room.hostId,
      online: Boolean(p.bot) || t - p.lastSeen <= PRESENCE_AWAY_MS,
      voted: Boolean(room.votes[p.id]),
      vote: room.revealed || p.id === viewerId ? (room.votes[p.id] ?? null) : null,
      variantId:
        room.revealed && room.votes[p.id]
          ? (room.variants[p.id] ?? selectVariantId(room, p.id, room.votes[p.id]))
          : null,
      snowUntil: room.snowUntil[p.id] && room.snowUntil[p.id] > t ? room.snowUntil[p.id] : 0,
    })),
    task: room.task,
    revealed: room.revealed,
    roundId: room.roundId,
    deckVariants: Object.fromEntries(
      SCALE.map((value) => [value, selectVariantId(room, viewerId, value)]),
    ) as Record<CardValue, string>,
    votesCount: Object.keys(room.votes).length,
    scale: SCALE,
    history: room.history,
    chat: room.chat.slice(-200),
  };
}

export function createRoom(
  code: string,
  player: StoredPlayer,
  options: { password?: RoomPassword } = {},
): StoredRoom {
  const room: StoredRoom = {
    code,
    cardBackId: randomCardBackId(),
    password: options.password,
    hostId: player.id,
    players: [player],
    task: null,
    votes: {},
    roundId: makeId("r"),
    variants: {},
    revealed: false,
    history: [],
    chat: [],
    snowUntil: {},
  };
  pushChat(room, {
    id: makeId("c"),
    kind: "system",
    text: `${player.name} создал(а) комнату.`,
    textEn: `${player.name} created the room.`,
    ts: player.lastSeen,
  });
  return room;
}

function expireAbandonedPlayers(room: StoredRoom): void {
  const cutoff = now() - PLAYER_RETENTION_MS;
  const expired = room.players.filter((player) => !player.bot && player.lastSeen < cutoff);
  if (!expired.length) return;
  const expiredIds = new Set(expired.map((player) => player.id));
  room.players = room.players.filter((player) => !expiredIds.has(player.id));
  for (const id of expiredIds) {
    delete room.votes[id];
    delete room.variants[id];
    delete room.snowUntil[id];
  }
  const presentPlayers = activePlayers(room);
  if (!presentPlayers.some((player) => player.id === room.hostId)) {
    room.hostId = presentPlayers[0]?.id ?? "";
  }
}

function requirePlayer(
  room: StoredRoom,
  playerId: string,
  token: string,
): { player: StoredPlayer; heartbeatDue: boolean } | null {
  const p = room.players.find((x) => x.id === playerId);
  if (!p || p.token !== token || p.leftAt) return null;
  const seenAt = now();
  const heartbeatDue = seenAt - p.lastSeen >= HEARTBEAT_WRITE_MS;
  p.lastSeen = seenAt;
  return { player: p, heartbeatDue };
}

export type RoomAction =
  | { type: "join"; name: string; playerId: string; token: string; password?: string }
  | { type: "resume"; playerId: string; token: string }
  | { type: "sync"; playerId: string; token: string }
  | { type: "chat"; playerId: string; token: string; text: string }
  | { type: "snowball"; playerId: string; token: string; targetId: string }
  | { type: "vote"; playerId: string; token: string; value: string }
  | { type: "set-task"; playerId: string; token: string; title: string; description: string }
  | { type: "reveal"; playerId: string; token: string }
  | { type: "revote"; playerId: string; token: string }
  | { type: "finalize"; playerId: string; token: string; result: string }
  | {
      type: "ask-outliers";
      playerId: string;
      token: string;
    }
  | { type: "leave"; playerId: string; token: string };

export type ApplyResult =
  | {
      ok: true;
      room: StoredRoom;
      you: string;
      empty?: boolean;
      persist?: boolean;
      hit?: { targetId: string };
    }
  | { ok: false; error: "unauthorized" | "invalid" };

export function applyAction(room: StoredRoom, action: RoomAction): ApplyResult {
  normalizeRoom(room);
  expireAbandonedPlayers(room);

  if (action.type === "join") {
    const name = action.name.trim().slice(0, 24) || "Player";
    const existingByToken = room.players.find((p) => p.token === action.token);
    const existingById = room.players.find((p) => p.id === action.playerId);
    const existing = existingByToken ?? existingById;
    if (existing) {
      if (existing.token !== action.token) return { ok: false, error: "unauthorized" };
      existing.name = name;
      existing.lastSeen = now();
      if (!existing.joinedAt) existing.joinedAt = now();
      delete existing.leftAt;
      if (!activePlayers(room).some((p) => p.id === room.hostId)) room.hostId = existing.id;
      return { ok: true, room, you: existing.id };
    }
    const player: StoredPlayer = {
      id: action.playerId,
      name,
      token: action.token,
      lastSeen: now(),
      joinedAt: now(),
    };
    room.players.push(player);
    if (!activePlayers(room).some((p) => p.id === room.hostId)) room.hostId = player.id;
    pushChat(room, {
      id: makeId("c"),
      kind: "system",
      text: `${name} входит в группу.`,
      textEn: `${name} joins the party.`,
      ts: now(),
    });
    return { ok: true, room, you: player.id };
  }

  const auth = requirePlayer(room, action.playerId, action.token);
  if (!auth) return { ok: false, error: "unauthorized" };
  const { player: me, heartbeatDue } = auth;
  const isHost = me.id === room.hostId;

  if (action.type === "sync" || action.type === "resume") {
    return { ok: true, room, you: me.id, persist: heartbeatDue };
  }

  if (action.type === "leave") {
    const leftAt = now();
    me.leftAt = leftAt;
    me.lastSeen = leftAt;
    delete room.votes[me.id];
    delete room.variants[me.id];
    delete room.snowUntil[me.id];
    const remainingPlayers = activePlayers(room);
    if (remainingPlayers.length === 0) return { ok: true, room, you: me.id, empty: true };
    if (room.hostId === me.id) room.hostId = remainingPlayers[0].id;
    if (!me.lastLeaveNoticeAt || leftAt - me.lastLeaveNoticeAt >= LEAVE_NOTICE_COOLDOWN_MS) {
      me.lastLeaveNoticeAt = leftAt;
      pushChat(room, {
        id: makeId("c"),
        kind: "system",
        text: `${me.name} покидает группу.`,
        textEn: `${me.name} leaves the party.`,
        ts: leftAt,
      });
    }
    return { ok: true, room, you: me.id };
  }

  if (action.type === "chat") {
    const text = action.text.trim().slice(0, 400);
    if (!text) return { ok: false, error: "invalid" };
    pushChat(room, {
      id: makeId("c"),
      kind: "say",
      fromId: me.id,
      from: me.name,
      text,
      ts: now(),
    });
    return { ok: true, room, you: me.id };
  }

  if (action.type === "snowball") {
    const target = activePlayers(room).find((p) => p.id === action.targetId);
    if (!target || target.id === me.id) return { ok: false, error: "invalid" };
    const until = now() + 10_000;
    room.snowUntil[target.id] = until;
    pushChat(room, {
      id: makeId("c"),
      kind: "snow",
      fromId: me.id,
      from: me.name,
      targetId: target.id,
      target: target.name,
      text: `${me.name} бросил снежок в ${target.name}.`,
      textEn: `${me.name} threw a snowball at ${target.name}.`,
      ts: now(),
    });
    return { ok: true, room, you: me.id, hit: { targetId: target.id } };
  }

  if (action.type === "vote") {
    if (!room.task || room.revealed || !isCard(action.value))
      return { ok: false, error: "invalid" };
    room.votes[me.id] = action.value;
    room.variants[me.id] = selectVariantId(room, me.id, action.value);
    return { ok: true, room, you: me.id };
  }

  if (action.type === "set-task") {
    if (!isHost) return { ok: false, error: "unauthorized" };
    const title = action.title.trim().slice(0, 140);
    const description = action.description.trim().slice(0, 4000);
    if (!title) return { ok: false, error: "invalid" };
    room.task = { id: makeId("t"), title, description };
    room.votes = {};
    room.roundId = makeId("r");
    room.variants = {};
    room.revealed = false;
    pushChat(room, {
      id: makeId("c"),
      kind: "system",
      text: `Ведущий выставил задачу: ${title}`,
      textEn: `The host posted a task: ${title}`,
      ts: now(),
    });
    return { ok: true, room, you: me.id };
  }

  if (action.type === "reveal") {
    if (!isHost || !room.task) return { ok: false, error: "unauthorized" };
    room.revealed = true;
    return { ok: true, room, you: me.id };
  }

  if (action.type === "revote") {
    if (!isHost || !room.task) return { ok: false, error: "unauthorized" };
    room.votes = {};
    room.roundId = makeId("r");
    room.variants = {};
    room.revealed = false;
    pushChat(room, {
      id: makeId("c"),
      kind: "system",
      text: "Новый круг голосования.",
      textEn: "A new voting round starts.",
      ts: now(),
    });
    return { ok: true, room, you: me.id };
  }

  if (action.type === "finalize") {
    if (!isHost || !room.task || !room.revealed || !isCard(action.result)) {
      return { ok: false, error: "unauthorized" };
    }
    room.history.unshift({
      id: room.task.id,
      title: room.task.title,
      description: room.task.description,
      result: action.result,
      resultVariantId: selectVariantId(room, "consensus", action.result),
      votes: Object.entries(room.votes).map(([id, value]) => ({
        name: room.players.find((p) => p.id === id)?.name || "?",
        value,
        variantId: room.variants[id] ?? selectVariantId(room, id, value),
      })),
      ts: now(),
    });
    if (room.history.length > 40) room.history = room.history.slice(0, 40);
    pushChat(room, {
      id: makeId("c"),
      kind: "system",
      text: `Задача «${room.task.title}» оценена как ${action.result}.`,
      textEn: `Task “${room.task.title}” estimated as ${action.result}.`,
      ts: now(),
    });
    room.task = null;
    room.votes = {};
    room.roundId = makeId("r");
    room.variants = {};
    room.revealed = false;
    return { ok: true, room, you: me.id };
  }

  if (action.type === "ask-outliers") {
    if (!isHost) return { ok: false, error: "unauthorized" };
    if (!room.task || !room.revealed) return { ok: false, error: "invalid" };
    const analysis = analyzeVotes(snapshot(room, me.id).players, true);
    const clean = (analysis?.askOrder ?? []).slice(0, 12).map((p) => ({
      name: p.name.slice(0, 24),
      vote: String(p.vote || ""),
    }));
    if (!clean.length) return { ok: false, error: "invalid" };
    const parts = clean.map((p) => `${p.name} (${p.vote})`);
    let text: string;
    let textEn: string;
    if (clean.length === 1) {
      text = `Сначала обсудите крайнюю оценку: ${parts[0]}.`;
      textEn = `Start with the farthest estimate: ${parts[0]}.`;
    } else {
      text = `Сначала обсудите крайние оценки: ${parts.join(", ")}.`;
      textEn = `Start with the farthest estimates: ${parts.join(", ")}.`;
    }
    pushChat(room, { id: makeId("c"), kind: "system", text, textEn, ts: now() });
    return { ok: true, room, you: me.id };
  }

  return { ok: false, error: "invalid" };
}
