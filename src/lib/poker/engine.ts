import {
  SCALE,
  type CardValue,
  type ChatEntry,
  type Snapshot,
  type StoredPlayer,
  type StoredRoom,
} from "./types";

export const DEMO_CODE = "RAID1";
export const DEMO_SNOW_AFTER_MS = 12_000;
const STALE_MS = 45_000;
const CHAT_CAP = 300;

export function now(): number {
  return Date.now();
}

export function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 6)}`;
}

export function makeCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return s;
}

export function isCard(value: unknown): value is CardValue {
  return typeof value === "string" && (SCALE as readonly string[]).includes(value);
}

function pushChat(room: StoredRoom, entry: ChatEntry): void {
  room.chat.push(entry);
  if (room.chat.length > CHAT_CAP) room.chat = room.chat.slice(-250);
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
  const t = now();
  return {
    code: room.code,
    hostId: room.hostId,
    players: room.players.map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.id === room.hostId,
      voted: Boolean(room.votes[p.id]),
      vote:
        room.revealed || p.id === viewerId ? (room.votes[p.id] ?? null) : null,
      snowUntil: room.snowUntil[p.id] && room.snowUntil[p.id] > t ? room.snowUntil[p.id] : 0,
    })),
    task: room.task,
    revealed: room.revealed,
    votesCount: Object.keys(room.votes).length,
    scale: SCALE,
    history: room.history,
    chat: room.chat.slice(-200),
  };
}

export function createRoom(code: string, player: StoredPlayer): StoredRoom {
  const room: StoredRoom = {
    code,
    hostId: player.id,
    players: [player],
    task: null,
    votes: {},
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

export function prunePlayers(room: StoredRoom): { changed: boolean; left: string[] } {
  const t = now();
  const left: string[] = [];
  const keep: StoredPlayer[] = [];
  for (const p of room.players) {
    if (p.bot) {
      keep.push(p);
      continue;
    }
    if (t - p.lastSeen > STALE_MS) left.push(p.id);
    else keep.push(p);
  }
  if (!left.length) return { changed: false, left };
  room.players = keep;
  for (const id of left) {
    delete room.votes[id];
    delete room.snowUntil[id];
  }
  if (keep.length && !keep.some((p) => p.id === room.hostId)) {
    room.hostId = keep[0].id;
  }
  return { changed: true, left };
}

function requirePlayer(room: StoredRoom, playerId: string, token: string): StoredPlayer | null {
  const p = room.players.find((x) => x.id === playerId);
  if (!p || p.token !== token) return null;
  p.lastSeen = now();
  return p;
}

export type RoomAction =
  | { type: "join"; name: string; playerId: string; token: string }
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
      order: { id: string; name: string; vote: string }[];
    }
  | { type: "leave"; playerId: string; token: string };

export type ApplyResult =
  | { ok: true; room: StoredRoom; you: string; empty?: boolean; hit?: { targetId: string } }
  | { ok: false; error: "unauthorized" | "invalid" };

export function applyAction(room: StoredRoom, action: RoomAction): ApplyResult {
  prunePlayers(room);

  if (action.type === "join") {
    const name = action.name.trim().slice(0, 24) || "Player";
    const existing = room.players.find((p) => p.id === action.playerId);
    if (existing) {
      if (existing.token !== action.token) return { ok: false, error: "unauthorized" };
      existing.name = name;
      existing.lastSeen = now();
      if (!existing.joinedAt) existing.joinedAt = now();
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
    if (!room.players.some((p) => p.id === room.hostId)) room.hostId = player.id;
    pushChat(room, {
      id: makeId("c"),
      kind: "system",
      text: `${name} входит в группу.`,
      textEn: `${name} joins the party.`,
      ts: now(),
    });
    return { ok: true, room, you: player.id };
  }

  const me = requirePlayer(room, action.playerId, action.token);
  if (!me) return { ok: false, error: "unauthorized" };
  const isHost = me.id === room.hostId;

  if (action.type === "sync") {
    return { ok: true, room, you: me.id };
  }

  if (action.type === "leave") {
    room.players = room.players.filter((p) => p.id !== me.id);
    delete room.votes[me.id];
    delete room.snowUntil[me.id];
    if (room.players.length === 0) return { ok: true, room, you: me.id, empty: true };
    if (room.hostId === me.id) room.hostId = room.players[0].id;
    pushChat(room, {
      id: makeId("c"),
      kind: "system",
      text: `${me.name} покидает группу.`,
      textEn: `${me.name} leaves the party.`,
      ts: now(),
    });
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
    const target = room.players.find((p) => p.id === action.targetId);
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
    if (!room.task || room.revealed || !isCard(action.value)) return { ok: false, error: "invalid" };
    room.votes[me.id] = action.value;
    return { ok: true, room, you: me.id };
  }

  if (action.type === "set-task") {
    if (!isHost) return { ok: false, error: "unauthorized" };
    const title = action.title.trim().slice(0, 140);
    const description = action.description.trim().slice(0, 4000);
    if (!title) return { ok: false, error: "invalid" };
    room.task = { id: makeId("t"), title, description };
    room.votes = {};
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
      votes: Object.entries(room.votes).map(([id, value]) => ({
        name: room.players.find((p) => p.id === id)?.name || "?",
        value,
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
    room.revealed = false;
    return { ok: true, room, you: me.id };
  }

  if (action.type === "ask-outliers") {
    if (!room.task || !room.revealed) return { ok: false, error: "invalid" };
    const clean = action.order
      .slice(0, 12)
      .map((p) => ({
        name: String(p.name || room.players.find((x) => x.id === p.id)?.name || "").slice(0, 24),
        vote: String(p.vote || ""),
      }))
      .filter((p) => p.name);
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
