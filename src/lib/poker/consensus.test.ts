import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeVotes } from "./consensus.ts";
import type { CardValue, PublicPlayer } from "./types.ts";

function player(id: string, vote: CardValue): PublicPlayer {
  return {
    id,
    name: id,
    isHost: id === "host",
    online: true,
    voted: true,
    vote,
    variantId: null,
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
});
