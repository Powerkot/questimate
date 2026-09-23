import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeVotes, buildVoteShowcase } from "./consensus.ts";
import type { CardValue, PublicPlayer } from "./types.ts";

function player(id: string, vote: CardValue, variantId: string | null = null): PublicPlayer {
  return {
    id,
    name: id,
    isHost: id === "host",
    online: true,
    voted: true,
    vote,
    variantId,
    snowUntil: 0,
  };
}

describe("analyzeVotes", () => {
  it("keeps clarification and break votes separate from size agreement", () => {
    const result = analyzeVotes([player("a", "s"), player("b", "s"), player("c", "?")], true);
    assert.ok(result);
    assert.equal(result.mode, "s");
    assert.equal(result.consensusPct, 100);
    assert.deepEqual(
      result.specials.map((item) => item.vote),
      ["?"],
    );
  });

  it("selects the estimate farthest from the majority rather than the largest remainder", () => {
    const result = analyzeVotes(
      [
        player("a", "XXL"),
        player("b", "XXL"),
        player("c", "XXL"),
        player("d", "m"),
        player("e", "xs"),
      ],
      true,
    );
    assert.ok(result);
    assert.deepEqual(
      result.outliers.map((item) => item.vote),
      ["xs"],
    );
  });

  it("shows an honest interval for an even median", () => {
    const result = analyzeVotes([player("a", "s"), player("b", "m")], true);
    assert.ok(result);
    assert.equal(result.median, "s–m");
  });

  it("keeps persisted character variants for the majority, minimum and maximum", () => {
    const result = analyzeVotes(
      [
        player("a", "s", "s-one"),
        player("b", "s", "s-two"),
        player("c", "m", "m-one"),
        player("d", "XXL", "xxl-one"),
      ],
      true,
    );
    assert.ok(result);

    const showcase = buildVoteShowcase(result);
    assert.deepEqual(showcase, {
      majority: {
        playerId: "a",
        playerName: "a",
        value: "s",
        variantId: "s-one",
      },
      minimum: {
        playerId: "b",
        playerName: "b",
        value: "s",
        variantId: "s-two",
      },
      maximum: {
        playerId: "d",
        playerName: "d",
        value: "XXL",
        variantId: "xxl-one",
      },
    });
  });

  it("shows only the majority card when there is no numeric range", () => {
    const result = analyzeVotes([player("a", "?", "question-one")], true);
    assert.ok(result);

    const showcase = buildVoteShowcase(result);
    assert.equal(showcase?.majority.value, "?");
    assert.equal(showcase?.minimum, null);
    assert.equal(showcase?.maximum, null);
  });
});
