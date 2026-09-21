import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { PokerResult } from "./types";

const id = z.string().regex(/^[a-zA-Z0-9_-]{6,48}$/);
const token = z.string().min(8).max(64);
const code = z.string().regex(/^[A-Z0-9]{5}$/);
const name = z.string().max(24);
const password = z.string().min(4).max(128).optional();

const createSchema = z.object({
  name,
  playerId: id,
  token,
  password,
});

const actionSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("join"), code, name, playerId: id, token, password }),
  z.object({ type: z.literal("resume"), code, playerId: id, token }),
  z.object({ type: z.literal("sync"), code, playerId: id, token }),
  z.object({ type: z.literal("chat"), code, playerId: id, token, text: z.string().max(400) }),
  z.object({
    type: z.literal("snowball"),
    code,
    playerId: id,
    token,
    targetId: id,
  }),
  z.object({ type: z.literal("vote"), code, playerId: id, token, value: z.string().max(8) }),
  z.object({
    type: z.literal("set-task"),
    code,
    playerId: id,
    token,
    title: z.string().max(140),
    description: z.string().max(4000),
  }),
  z.object({ type: z.literal("reveal"), code, playerId: id, token }),
  z.object({ type: z.literal("revote"), code, playerId: id, token }),
  z.object({ type: z.literal("finalize"), code, playerId: id, token, result: z.string().max(8) }),
  z.object({ type: z.literal("ask-outliers"), code, playerId: id, token }),
  z.object({ type: z.literal("leave"), code, playerId: id, token }),
]);

export type PokerActionInput = z.infer<typeof actionSchema>;

export const createPokerRoomFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => createSchema.parse(data))
  .handler(async ({ data }): Promise<PokerResult> => {
    const { createPokerRoom } = await import("./store.server");
    return createPokerRoom(data);
  });

export const pokerActionFn = createServerFn({ method: "POST" })
  .validator((data: unknown) => actionSchema.parse(data))
  .handler(async ({ data }): Promise<PokerResult> => {
    const { handlePokerAction } = await import("./store.server");
    return handlePokerAction(data);
  });
