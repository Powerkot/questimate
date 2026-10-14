import { CHARACTERS } from "./player-profile.ts";
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

describe("shared quest deck themes", () => {
  const auth = { playerId: "host01", token: "host-token" };
  function setup() {
    return createRoom("THEMES", stored(auth.playerId, auth.token, Date.now()));
  }
  it("shares a persisted theme with every viewer and keeps it during a revote", () => {
    const room = setup();
    applyAction(room, { type: "set-task", ...auth, title: "Quest", description: "" });
    const theme = snapshot(room, auth.playerId).deckThemeId;
    assert.equal(snapshot(room, "another-viewer").deckThemeId, theme);
    applyAction(room, { type: "reveal", ...auth });
    applyAction(room, { type: "revote", ...auth });
    assert.equal(snapshot(room, auth.playerId).deckThemeId, theme);
    const restored: typeof room = JSON.parse(JSON.stringify(room));
    assert.equal(snapshot(restored, "rejoined-viewer").deckThemeId, theme);
  });
  it("changes on each new quest, including queued quests and after the history cap", () => {
    const room = setup();
    let previous = snapshot(room, auth.playerId).deckThemeId;
    const seen = new Set<string>();
    for (let i = 0; i < 45; i++) {
      if (i % 2) {
        assert.equal(
          applyAction(room, { type: "queue-task", ...auth, title: `Quest ${i}`, description: "" })
            .ok,
          true,
        );
        assert.equal(
          applyAction(room, { type: "start-queued", ...auth, taskId: room.queue![0].id }).ok,
          true,
        );
      } else {
        assert.equal(
          applyAction(room, { type: "set-task", ...auth, title: `Quest ${i}`, description: "" }).ok,
          true,
        );
      }
      const theme = snapshot(room, auth.playerId).deckThemeId;
      assert.notEqual(theme, previous);
      if (i < 9) seen.add(theme);
      previous = theme;
      assert.equal(applyAction(room, { type: "reveal", ...auth }).ok, true);
      assert.equal(applyAction(room, { type: "finalize", ...auth, result: "xl" }).ok, true);
      assert.equal(snapshot(room, auth.playerId).deckThemeId, theme);
    }
    assert.equal(seen.size, 9);
    assert.equal(room.history.length, 40);
  });
  it("gives old rooms a stable approved theme", () => {
    const room = setup();
    delete room.deckThemeId;
    assert.equal(
      snapshot(room, "a").deckThemeId,
      snapshot(JSON.parse(JSON.stringify(room)), "b").deckThemeId,
    );
  });
});

describe("player character and optional title", () => {
  const host = { playerId: "host01", token: "host-token" };
  const guest = { playerId: "guest01", token: "guest-token" };
  it("rejects another player's character and preserves the original choice", () => {
    const room = createRoom("AVATR", {
      ...stored(host.playerId, host.token, Date.now()),
      avatarId: "portrait-01",
      titleId: "backlog",
    });
    const result = applyAction(room, {
      type: "join",
      ...guest,
      name: "Guest",
      avatarId: "portrait-01",
      titleId: null,
    });
    assert.deepEqual(result, { ok: false, error: "avatar_taken" });
    assert.equal(room.players.length, 1);
    assert.equal(snapshot(room, host.playerId).players[0].titleId, "backlog");
  });
  it("keeps a chosen character and no-title preference across reconnect and host transfer", () => {
    const room = createRoom("AVATR", stored(host.playerId, host.token, Date.now()));
    const character = "portrait-12";
    // The host's automatically assigned legacy avatar can be this character.
    room.players[0].avatarId = "portrait-01";
    assert.equal(
      applyAction(room, {
        type: "join",
        ...guest,
        name: "Guest",
        avatarId: character,
        titleId: null,
      }).ok,
      true,
    );
    assert.equal(
      applyAction(room, { type: "transfer-host", ...host, targetId: guest.playerId }).ok,
      true,
    );
    const restored: typeof room = JSON.parse(JSON.stringify(room));
    assert.equal(applyAction(restored, { type: "resume", ...guest }).ok, true);
    const player = snapshot(restored, guest.playerId).players.find((p) => p.id === guest.playerId)!;
    assert.equal(player.avatarId, character);
    assert.equal(player.titleId, null);
    assert.equal(player.isHost, true);
    assert.equal(applyAction(restored, { type: "join", ...guest, name: "Guest" }).ok, true);
    assert.equal(restored.players.find((p) => p.id === guest.playerId)!.avatarId, character);
  });
  it("reserves away characters and validates arbitrary submitted choices", () => {
    const room = createRoom("AVATR", {
      ...stored(host.playerId, host.token, Date.now()),
      avatarId: "portrait-01",
    });
    room.players[0].lastSeen -= 120_000;
    assert.equal(
      applyAction(room, { type: "join", ...guest, name: "Guest", avatarId: "portrait-01" }).ok,
      false,
    );
    assert.equal(
      applyAction(room, { type: "join", ...guest, name: "Guest", avatarId: "invented" }).ok,
      false,
    );
    assert.equal(
      applyAction(room, { type: "join", ...guest, name: "Guest", titleId: "invented" }).ok,
      false,
    );
  });
  it("assigns unique stable characters to existing rooms", () => {
    const room = buildDemoRoom();
    const first = snapshot(room, "viewer").players.map((p) => p.avatarId);
    assert.equal(new Set(first).size, first.length);
    assert.deepEqual(
      snapshot(JSON.parse(JSON.stringify(room)), "viewer").players.map((p) => p.avatarId),
      first,
    );
  });
});

it("releases a character after an explicit leave without changing a present player's choice", () => {
  const host = { playerId: "host01", token: "host-token" };
  const guest = { playerId: "guest01", token: "guest-token" };
  const room = createRoom("AVATR", {
    ...stored(host.playerId, host.token, Date.now()),
    avatarId: "portrait-01",
  });
  applyAction(room, {
    type: "join",
    ...guest,
    name: "Guest",
    avatarId: "portrait-12",
    titleId: null,
  });
  applyAction(room, { type: "leave", ...guest });
  assert.equal(
    applyAction(room, {
      type: "join",
      playerId: "guest02",
      token: "guest-token-02",
      name: "New guest",
      avatarId: "portrait-12",
    }).ok,
    true,
  );
  assert.equal(
    snapshot(room, host.playerId).players.find((p) => p.id === "guest02")!.avatarId,
    "portrait-12",
  );
  assert.equal(room.players[0].avatarId, "portrait-01");
});

describe("observers do not occupy player seats or ballots", () => {
  const host = { playerId: "host01", token: "host-token" };
  it("supports six voters and seventy observers with exactly six ballots", () => {
    const room = createRoom("WATCH", {
      ...stored(host.playerId, host.token, Date.now()),
      avatarId: "portrait-01",
      titleId: null,
    });
    for (let i = 2; i <= 6; i++) {
      assert.equal(
        applyAction(room, {
          type: "join",
          playerId: `voter0${i}`,
          token: `voter-token-${i}`,
          name: `Voter ${i}`,
          avatarId: `portrait-0${i}`,
        }).ok,
        true,
      );
    }
    applyAction(room, { type: "set-task", ...host, title: "Quest", description: "" });
    for (const player of room.players)
      assert.equal(
        applyAction(room, { type: "vote", playerId: player.id, token: player.token, value: "s" })
          .ok,
        true,
      );
    for (let i = 0; i < 70; i++)
      assert.equal(
        applyAction(room, {
          type: "join",
          playerId: `watch${String(i).padStart(3, "0")}`,
          token: `watch-token-${i}`,
          name: `Observer ${i}`,
          spectator: true,
        }).ok,
        true,
      );
    const viewer = { playerId: "watch000", token: "watch-token-0" };
    assert.deepEqual(applyAction(room, { type: "vote", ...viewer, value: "XXL" }), {
      ok: false,
      error: "unauthorized",
    });
    assert.equal(applyAction(room, { type: "chat", ...viewer, text: "Watching!" }).ok, true);
    const hidden = snapshot(room, viewer.playerId);
    assert.equal(hidden.players.filter((p) => !p.spectator).length, 6);
    assert.equal(hidden.players.filter((p) => p.spectator).length, 70);
    assert.equal(hidden.players.filter((p) => p.spectator && p.avatarId).length, 0);
    assert.equal(hidden.votesCount, 6);
    assert.equal(hidden.players.filter((p) => p.vote).length, 0);
    // A stale or injected observer ballot must never enter counts or results.
    room.votes[viewer.playerId] = "XXL";
    applyAction(room, { type: "reveal", ...host });
    const revealed = snapshot(room, viewer.playerId);
    assert.equal(revealed.votesCount, 6);
    assert.equal(revealed.players.filter((p) => p.vote === "s").length, 6);
    assert.equal(revealed.players.find((p) => p.id === viewer.playerId)!.vote, null);
    applyAction(room, { type: "finalize", ...host, result: "s" });
    assert.equal(room.history[0].votes.length, 6);
    assert.equal(new Set(room.players.filter((p) => !p.spectator).map((p) => p.avatarId)).size, 6);
  });
  it("removes a ballot and releases the portrait when a participant rejoins as observer", () => {
    const room = createRoom("WATCH", {
      ...stored(host.playerId, host.token, Date.now()),
      avatarId: "portrait-01",
    });
    applyAction(room, { type: "set-task", ...host, title: "Quest", description: "" });
    applyAction(room, { type: "vote", ...host, value: "xl" });
    assert.equal(
      applyAction(room, { type: "join", ...host, name: "Host", spectator: true }).ok,
      true,
    );
    assert.equal(snapshot(room, host.playerId).votesCount, 0);
    assert.equal(room.players[0].avatarId, undefined);
    assert.equal(room.players[0].spectator, true);
    assert.equal(
      applyAction(room, {
        type: "join",
        playerId: "voter02",
        token: "voter-token-02",
        name: "Voter",
        avatarId: "portrait-01",
      }).ok,
      true,
    );
  });
});

it("admits observers even when every character portrait is taken", () => {
  const room = createRoom("WATCH", {
    ...stored("host01", "host-token", Date.now()),
    avatarId: "portrait-01",
  });
  for (let i = 2; i <= CHARACTERS.length; i++)
    assert.equal(
      applyAction(room, {
        type: "join",
        playerId: `voter${String(i).padStart(3, "0")}`,
        token: `voter-token-${i}`,
        name: `Voter ${i}`,
        avatarId: CHARACTERS[i - 1].id,
      }).ok,
      true,
    );
  assert.equal(
    applyAction(room, {
      type: "join",
      playerId: "watch001",
      token: "watch-token-001",
      name: "Observer",
      spectator: true,
    }).ok,
    true,
  );
  assert.equal(snapshot(room, "watch001").players.filter((p) => p.spectator).length, 1);
});
