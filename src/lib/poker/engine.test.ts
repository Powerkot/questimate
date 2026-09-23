import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardBackIds, cardVariantIds, estimateCardArt } from "./cards.ts";
import { buildDemoRoom, prepareDemoJoin } from "./demo.ts";
import { applyAction, createRoom, normalizeRoom, selectVariantId, snapshot } from "./engine.ts";
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

  it("keeps an away player's seat and vote until they explicitly leave", () => {
    const originalNow = Date.now;
    try {
      let time = 1_000;
      Date.now = () => time;
      const room = createRoom("ABCDE", stored("host01", "host-token", time));
      applyAction(room, {
        type: "join",
        playerId: "guest01",
        token: "guest-token",
        name: "Guest",
      });
      room.task = { id: "task01", title: "Quest", description: "" };
      applyAction(room, { type: "vote", playerId: "host01", token: "host-token", value: "s" });

      time += 3 * 60_000;
      const awayState = snapshot(room, "host01");
      const guest = awayState.players.find((player) => player.id === "guest01");

      assert.equal(awayState.players.length, 2);
      assert.equal(guest?.online, false);
      assert.equal(guest?.voted, false);
      assert.equal(Object.keys(room.votes).length, 1);
    } finally {
      Date.now = originalNow;
    }
  });

  it("resumes the same player after a mobile suspension without a password", () => {
    const originalNow = Date.now;
    try {
      let time = 1_000;
      Date.now = () => time;
      const room = createRoom("ABCDE", stored("host01", "host-token", time), {
        password: { salt: "salt", hash: "hash" },
      });
      room.task = { id: "task01", title: "Quest", description: "" };
      applyAction(room, { type: "vote", playerId: "host01", token: "host-token", value: "m" });

      time += 3 * 60_000;
      assert.equal(snapshot(room, "host01").players[0].online, false);
      assert.deepEqual(applyAction(room, { type: "resume", playerId: "host01", token: "wrong" }), {
        ok: false,
        error: "unauthorized",
      });

      const resumed = applyAction(room, {
        type: "resume",
        playerId: "host01",
        token: "host-token",
      });
      assert.equal(resumed.ok, true);
      assert.equal(snapshot(room, "host01").players[0].online, true);
      assert.equal(room.votes.host01, "m");
    } finally {
      Date.now = originalNow;
    }
  });

  it("reuses one membership when the same browser repeatedly leaves and changes its name", () => {
    const originalNow = Date.now;
    try {
      let time = 1_000;
      Date.now = () => time;
      const room = createRoom("ABCDE", stored("host01", "host-token", time));
      applyAction(room, {
        type: "join",
        playerId: "guest01",
        token: "guest-token",
        name: "Guest",
      });

      for (let index = 0; index < 5; index += 1) {
        time += 1_000;
        assert.equal(
          applyAction(room, { type: "leave", playerId: "guest01", token: "guest-token" }).ok,
          true,
        );
        assert.equal(snapshot(room, "host01").players.length, 1);

        time += 1_000;
        const joined = applyAction(room, {
          type: "join",
          playerId: "guest01",
          token: "guest-token",
          name: `Guest ${index}`,
        });
        assert.equal(joined.ok && joined.you, "guest01");
      }

      assert.equal(room.players.length, 2);
      assert.equal(snapshot(room, "host01").players.length, 2);
      assert.equal(room.players.find((player) => player.id === "guest01")?.name, "Guest 4");
      assert.equal(
        room.chat.filter((entry) => entry.textEn?.includes("leaves the party")).length,
        1,
      );
    } finally {
      Date.now = originalNow;
    }
  });

  it("reuses the browser membership even if its player id is changed", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    applyAction(room, {
      type: "join",
      playerId: "guest01",
      token: "guest-token",
      name: "Guest",
    });
    applyAction(room, { type: "leave", playerId: "guest01", token: "guest-token" });

    const joined = applyAction(room, {
      type: "join",
      playerId: "changed-id",
      token: "guest-token",
      name: "Changed name",
    });

    assert.equal(joined.ok && joined.you, "guest01");
    assert.equal(room.players.length, 2);
    assert.equal(snapshot(room, "host01").players.at(-1)?.name, "Changed name");
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
    const preview = snapshot(room, "host01").deckVariants.m;
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
    assert.equal(first, preview);
    assert.equal(first, second);
  });

  it("rotates character art between randomized rounds", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    room.task = { id: "task01", title: "Quest", description: "" };
    const variants = new Set<string>();
    for (let index = 0; index < 32; index += 1) {
      room.roundId = `round-${index}`;
      variants.add(selectVariantId(room, "host01", "s"));
    }
    assert.equal(cardVariantIds("s").length, 4);
    assert.ok(variants.size > 1);
  });

  it("serves the lightweight estimate deck without character art", () => {
    assert.equal(estimateCardArt("xs"), "/cards/estimate/xs.webp");
    assert.equal(estimateCardArt("XXL"), "/cards/estimate/xxl.webp");
    assert.equal(estimateCardArt("?"), null);
    assert.equal(estimateCardArt("☕"), null);
  });

  it("stores one character variant for the final consensus reveal", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    applyAction(room, {
      type: "set-task",
      playerId: "host01",
      token: "host-token",
      title: "Quest",
      description: "",
    });
    applyAction(room, { type: "vote", playerId: "host01", token: "host-token", value: "m" });
    applyAction(room, { type: "reveal", playerId: "host01", token: "host-token" });

    const finalized = applyAction(room, {
      type: "finalize",
      playerId: "host01",
      token: "host-token",
      result: "m",
    });

    assert.equal(finalized.ok, true);
    assert.match(room.history[0].resultVariantId ?? "", /^m-/);
    assert.equal(room.history[0].result, "m");
    assert.match(room.chat.at(-1)?.text ?? "", /оценена как M\./);
  });

  it("keeps one valid card back for the whole room", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    const initialBack = room.cardBackId;
    assert.ok(cardBackIds().includes(initialBack));

    applyAction(room, {
      type: "set-task",
      playerId: "host01",
      token: "host-token",
      title: "Quest",
      description: "",
    });
    applyAction(room, { type: "revote", playerId: "host01", token: "host-token" });

    assert.equal(room.cardBackId, initialBack);
    assert.equal(snapshot(room, "host01").cardBackId, initialBack);
  });

  it("only exposes whether a room is protected, never its password hash", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()), {
      password: { salt: "private-salt", hash: "private-hash" },
    });
    const publicState = snapshot(room, "host01");

    assert.equal(publicState.passwordProtected, true);
    assert.equal(JSON.stringify(publicState).includes("private-salt"), false);
    assert.equal(JSON.stringify(publicState).includes("private-hash"), false);
  });

  it("gives legacy rooms a deterministic card back", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    delete (room as Partial<typeof room>).cardBackId;
    const first = normalizeRoom(room).cardBackId;
    delete (room as Partial<typeof room>).cardBackId;
    const second = normalizeRoom(room).cardBackId;
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
    assert.match(room.chat.at(-1)?.text ?? "", /Guest \(XXL\)/);
  });
});
