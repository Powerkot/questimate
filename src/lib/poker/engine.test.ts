import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildDemoRoom, prepareDemoJoin } from "./demo.ts";
import { applyAction, createRoom, snapshot } from "./engine.ts";
import type { StoredPlayer } from "./types.ts";

function stored(id: string, token: string, time: number): StoredPlayer {
  return { id, token, name: id, lastSeen: time, joinedAt: time };
}

describe("poker engine", () => {
  it("opens the demo as an interactive round led by the visitor", () => {
    const room = buildDemoRoom();
    room.revealed = true;
    room.hostId = "botolga";
    room.players.push(stored("guest01", "guest-token", Date.now()));
    room.votes.guest01 = "xl";

    prepareDemoJoin(room, "guest01");

    assert.equal(room.revealed, false);
    assert.equal(room.hostId, "guest01");
    assert.equal(room.votes.guest01, undefined);
    assert.equal(room.task?.id, "t-demo-now");
    assert.equal(room.votes.botolga, "s");
  });

  it("asks the store to persist a throttled heartbeat", () => {
    const originalNow = Date.now;
    try {
      let time = 1_000;
      Date.now = () => time;
      const room = createRoom("ABCDE", stored("host01", "host-token", time));
      time += 1_000;
      const early = applyAction(room, { type: "sync", playerId: "host01", token: "host-token" });
      assert.equal(early.ok && early.persist, false);
      time += 15_000;
      const due = applyAction(room, { type: "sync", playerId: "host01", token: "host-token" });
      assert.equal(due.ok && due.persist, true);
    } finally {
      Date.now = originalNow;
    }
  });

  it("keeps a selected character variant stable for the round", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    assert.equal(
      applyAction(room, {
        type: "set-task",
        playerId: "host01",
        token: "host-token",
        title: "Quest",
        description: "",
      }).ok,
      true,
    );
    assert.equal(
      applyAction(room, {
        type: "vote",
        playerId: "host01",
        token: "host-token",
        value: "m",
      }).ok,
      true,
    );
    assert.equal(
      applyAction(room, { type: "reveal", playerId: "host01", token: "host-token" }).ok,
      true,
    );
    const first = snapshot(room, "host01").players[0].variantId;
    const second = snapshot(room, "host01").players[0].variantId;
    assert.ok(first?.startsWith("m-"));
    assert.equal(first, second);
  });

  it("allows only the host to publish server-derived discussion order", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    assert.equal(
      applyAction(room, {
        type: "join",
        playerId: "guest01",
        token: "guest-token",
        name: "Guest",
      }).ok,
      true,
    );
    assert.equal(
      applyAction(room, {
        type: "set-task",
        playerId: "host01",
        token: "host-token",
        title: "Quest",
        description: "",
      }).ok,
      true,
    );
    applyAction(room, { type: "vote", playerId: "host01", token: "host-token", value: "s" });
    applyAction(room, { type: "vote", playerId: "guest01", token: "guest-token", value: "XXL" });
    applyAction(room, { type: "reveal", playerId: "host01", token: "host-token" });

    const guest = applyAction(room, {
      type: "ask-outliers",
      playerId: "guest01",
      token: "guest-token",
    });
    assert.deepEqual(guest, { ok: false, error: "unauthorized" });
    const host = applyAction(room, {
      type: "ask-outliers",
      playerId: "host01",
      token: "host-token",
    });
    assert.equal(host.ok, true);
    assert.match(room.chat.at(-1)?.text ?? "", /крайн/);
  });
});
