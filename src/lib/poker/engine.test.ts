import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardBackIds, cardVariantIds, estimateCardArt } from "./cards.ts";
import { applyDemoAction, buildDemoRoom, prepareDemoJoin, tickDemoRoom } from "./demo.ts";
import {
  DEMO_CODE,
  applyAction,
  createRoom,
  normalizeRoom,
  selectVariantId,
  snapshot,
} from "./engine.ts";
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
    assert.equal(room.votes.botolga, undefined);
  });

  it("starts every demo visitor in an isolated pristine sandbox", () => {
    const first = applyDemoAction(null, {
      type: "join",
      name: "First visitor",
      playerId: "guest01",
      token: "guest-token-01",
    });
    assert.equal(first.result.ok, true);
    assert.ok(first.room);

    const changed = applyDemoAction(first.room, {
      type: "chat",
      playerId: "guest01",
      token: "guest-token-01",
      text: "This must stay private",
    });
    assert.equal(changed.result.ok, true);
    assert.equal(changed.room?.chat.at(-1)?.text, "This must stay private");

    const second = applyDemoAction(changed.room, {
      type: "join",
      name: "Second visitor",
      playerId: "guest02",
      token: "guest-token-02",
    });
    assert.equal(second.result.ok, true);
    assert.equal(second.room?.code, DEMO_CODE);
    assert.equal(second.room?.players.length, 6);
    assert.equal(
      second.room?.players.some((player) => player.id === "guest01"),
      false,
    );
    assert.equal(
      second.room?.players.some((player) => player.id === "guest02"),
      true,
    );
    assert.equal(
      second.room?.chat.some((entry) => entry.text === "This must stay private"),
      false,
    );
    assert.equal(second.room?.history.length, 3);
    assert.equal(second.room?.votes.guest02, undefined);
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
    assert.equal(estimateCardArt("?"), "/cards/estimate/question.webp");
    assert.equal(estimateCardArt("☕"), "/cards/estimate/break.webp");
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

  it("returns a fresh history collection in every snapshot", () => {
    const room = createRoom("ABCDE", stored("host01", "host-token", Date.now()));
    const first = snapshot(room, "host01");
    const second = snapshot(room, "host01");

    assert.notEqual(first.history, room.history);
    assert.notEqual(first.history, second.history);
  });

  it("keeps the decision note, duration and every revealed voting round in history", () => {
    const originalNow = Date.now;
    try {
      let time = 10_000;
      Date.now = () => time;
      const room = createRoom("ABCDE", stored("host01", "host-token", time));
      applyAction(room, {
        type: "set-task",
        playerId: "host01",
        token: "host-token",
        title: "Quest",
        description: "Details",
      });
      applyAction(room, { type: "vote", playerId: "host01", token: "host-token", value: "s" });
      applyAction(room, { type: "reveal", playerId: "host01", token: "host-token" });

      time += 60_000;
      applyAction(room, { type: "revote", playerId: "host01", token: "host-token" });
      applyAction(room, { type: "vote", playerId: "host01", token: "host-token", value: "m" });
      applyAction(room, { type: "reveal", playerId: "host01", token: "host-token" });

      time += 120_000;
      const finalized = applyAction(room, {
        type: "finalize",
        playerId: "host01",
        token: "host-token",
        result: "m",
        note: "  We reduced the unknowns.  ",
      });

      assert.equal(finalized.ok, true);
      assert.equal(room.history[0].startedAt, 10_000);
      assert.equal(room.history[0].ts, 190_000);
      assert.equal(room.history[0].finalizedBy, "host01");
      assert.equal(room.history[0].decisionNote, "We reduced the unknowns.");
      assert.deepEqual(
        room.history[0].rounds?.map((round) => round.votes[0].value),
        ["s", "m"],
      );
      assert.deepEqual(room.completedRounds, []);
    } finally {
      Date.now = originalNow;
    }
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
});

describe("Questimate 2.0 task journal and host actions", () => {
  const auth = { playerId: "host001", token: "host-token-001" };
  function setup() {
    const room = createRoom("TEST2", stored(auth.playerId, auth.token, Date.now()));
    applyAction(room, {
      type: "join",
      playerId: "guest01",
      token: "guest-token-01",
      name: "Guest",
    });
    return room;
  }
  it("keeps queued quests out of voting until started, then archives only a confirmed result", () => {
    const room = setup();
    assert.equal(
      applyAction(room, {
        type: "queue-task",
        ...auth,
        title: "Next quest",
        description: "Details",
      }).ok,
      true,
    );
    const taskId = room.queue![0].id;
    assert.equal(room.task, null);
    assert.equal(snapshot(room, auth.playerId).queue.length, 1);
    assert.equal(applyAction(room, { type: "start-queued", ...auth, taskId }).ok, true);
    assert.equal(snapshot(room, auth.playerId).task?.id, taskId);
    assert.equal(room.queue!.length, 0);
    applyAction(room, { type: "vote", ...auth, value: "m" });
    applyAction(room, { type: "reveal", ...auth });
    assert.equal(room.history.length, 0);
    applyAction(room, { type: "finalize", ...auth, result: "m" });
    assert.equal(room.history[0].id, taskId);
    assert.equal(room.task, null);
  });
  it("rejects guest queue and host actions, and cannot replace an active task", () => {
    const room = setup();
    const guest = { playerId: "guest01", token: "guest-token-01" };
    for (const action of [
      { type: "queue-task" as const, ...guest, title: "No", description: "" },
      { type: "transfer-host" as const, ...guest, targetId: auth.playerId },
      { type: "kick" as const, ...guest, targetId: auth.playerId },
    ])
      assert.equal(applyAction(room, action).ok, false);
    applyAction(room, { type: "set-task", ...auth, title: "Active", description: "" });
    const taskId = room.task?.id;
    assert.equal(
      applyAction(room, { type: "set-task", ...auth, title: "Replacement", description: "" }).ok,
      false,
    );
    applyAction(room, { type: "queue-task", ...auth, title: "Queued", description: "" });
    assert.equal(
      applyAction(room, { type: "start-queued", ...auth, taskId: room.queue![0].id }).ok,
      false,
    );
    assert.equal(snapshot(room, auth.playerId).task?.id, taskId);
    assert.equal(room.queue!.length, 1);
  });
  it("transfers authority immediately and rejects a removed member's resume and rejoin", () => {
    const room = setup();
    assert.equal(
      applyAction(room, { type: "transfer-host", ...auth, targetId: "guest01" }).ok,
      true,
    );
    assert.equal(applyAction(room, { type: "kick", ...auth, targetId: "guest01" }).ok, false);
    const newHost = { playerId: "guest01", token: "guest-token-01" };
    assert.equal(applyAction(room, { type: "kick", ...newHost, targetId: auth.playerId }).ok, true);
    assert.equal(snapshot(room, newHost.playerId).players.length, 1);
    assert.equal(applyAction(room, { type: "resume", ...auth }).ok, false);
    assert.equal(applyAction(room, { type: "join", ...auth, name: "Back" }).ok, false);
  });
});

it("deals demo votes gradually and never fills votes after a reveal", () => {
  const room = buildDemoRoom();
  room.players.push(stored("guest01", "guest-token-01", Date.now()));
  prepareDemoJoin(room, "guest01");
  assert.equal(Object.keys(room.votes).length, 0);
  room.demoVotingAt = Date.now() - 3000;
  tickDemoRoom(room);
  assert.equal(Object.keys(room.votes).length, 2);
  room.revealed = true;
  room.demoVotingAt = Date.now() - 20000;
  tickDemoRoom(room);
  assert.equal(Object.keys(room.votes).length, 2);
});
