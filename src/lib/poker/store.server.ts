import { getSql } from "@/lib/db";
import { buildDemoRoom, prepareDemoJoin, tickDemoRoom } from "./demo";
import {
  DEMO_CODE,
  applyAction,
  createRoom,
  makeCode,
  makeId,
  normalizeRoom,
  now,
  snapshot,
  type RoomAction,
} from "./engine";
import { hashRoomPassword, verifyRoomPassword } from "./password.server";
import type { PokerResult, StoredRoom } from "./types";

function asRoom(raw: unknown): StoredRoom {
  const room = typeof raw === "string" ? (JSON.parse(raw) as StoredRoom) : (raw as StoredRoom);
  return normalizeRoom(room);
}

async function load(code: string): Promise<{ room: StoredRoom; version: number } | null> {
  const sql = await getSql();
  const rows = await sql.query<{ version: number; state: unknown }>(
    `select version, state
       from poker_rooms
      where code = $1
        and (code = $2 or created_at > now() - interval '24 hours')`,
    [code, DEMO_CODE],
  );
  const row = rows[0];
  if (!row) return null;
  return { room: asRoom(row.state), version: row.version };
}

async function insert(room: StoredRoom): Promise<boolean> {
  const sql = await getSql();
  try {
    await sql.query(
      `insert into poker_rooms (code, version, state, updated_at) values ($1, 0, $2::jsonb, now())`,
      [room.code, JSON.stringify(room)],
    );
    return true;
  } catch {
    return false;
  }
}

async function save(code: string, version: number, room: StoredRoom): Promise<boolean> {
  const sql = await getSql();
  const rows = await sql.query<{ version: number }>(
    `update poker_rooms
       set state = $1::jsonb, version = version + 1, updated_at = now()
     where code = $2 and version = $3
     returning version`,
    [JSON.stringify(room), code, version],
  );
  return rows.length > 0;
}

async function remove(code: string): Promise<void> {
  if (code === DEMO_CODE) return;
  const sql = await getSql();
  await sql.query(`delete from poker_rooms where code = $1`, [code]);
}

async function purgeExpiredRooms(): Promise<void> {
  const sql = await getSql();
  await sql.query(
    `delete from poker_rooms where code <> $1 and created_at <= now() - interval '24 hours'`,
    [DEMO_CODE],
  );
}

async function ensureDemoRoom(): Promise<void> {
  const existing = await load(DEMO_CODE);
  if (existing) return;
  const room = buildDemoRoom();
  const ok = await insert(room);
  if (!ok) return;
}

export async function createPokerRoom(input: {
  name: string;
  playerId: string;
  token: string;
  password?: string;
}): Promise<PokerResult> {
  await purgeExpiredRooms();
  const name = input.name.trim().slice(0, 24) || "Host";
  const player = {
    id: input.playerId || makeId("p"),
    name,
    token: input.token,
    lastSeen: now(),
    joinedAt: now(),
  };
  const roomPassword = input.password ? await hashRoomPassword(input.password) : undefined;
  for (let i = 0; i < 8; i++) {
    const code = makeCode();
    if (code === DEMO_CODE) continue;
    const room = createRoom(code, player, { password: roomPassword });
    const ok = await insert(room);
    if (ok) return { ok: true, you: player.id, state: snapshot(room, player.id) };
  }
  return { ok: false, error: "invalid" };
}

export async function handlePokerAction(
  action: RoomAction & { code: string },
): Promise<PokerResult> {
  await purgeExpiredRooms();
  if (action.code === DEMO_CODE) await ensureDemoRoom();
  for (let attempt = 0; attempt < 6; attempt++) {
    const loaded = await load(action.code);
    if (!loaded) return { ok: false, error: "room_not_found" };
    const { room, version } = loaded;
    if (action.type === "join" && room.password) {
      if (!action.password) return { ok: false, error: "password_required" };
      if (!(await verifyRoomPassword(action.password, room.password))) {
        return { ok: false, error: "wrong_password" };
      }
    }
    const result = applyAction(room, action);
    if (!result.ok) return { ok: false, error: result.error };
    if (action.code === DEMO_CODE && action.type === "join") {
      prepareDemoJoin(result.room, result.you);
    }
    const demoChanged = action.code === DEMO_CODE ? tickDemoRoom(result.room) : false;
    if (action.type === "sync" || action.type === "resume") {
      if (demoChanged || result.persist) {
        const saved = await save(action.code, version, result.room);
        if (!saved) continue;
      }
      return { ok: true, you: result.you, state: snapshot(result.room, result.you) };
    }
    if (result.empty) {
      await remove(action.code);
      return { ok: true, you: result.you, state: snapshot(result.room, result.you) };
    }
    const saved = await save(action.code, version, result.room);
    if (!saved) continue;
    return { ok: true, you: result.you, state: snapshot(result.room, result.you) };
  }
  return { ok: false, error: "invalid" };
}
