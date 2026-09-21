import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { tableLayoutMode, tableSeatPosition } from "./table-layout.ts";

describe("poker table layout", () => {
  it("switches layouts without imposing a player limit", () => {
    assert.equal(tableLayoutMode(1), "round");
    assert.equal(tableLayoutMode(6), "round");
    assert.equal(tableLayoutMode(7), "long");
    assert.equal(tableLayoutMode(12), "long");
    assert.equal(tableLayoutMode(13), "hall");
    assert.equal(tableLayoutMode(50), "hall");
  });

  it("places every player around the long table", () => {
    const positions = Array.from({ length: 12 }, (_, index) =>
      tableSeatPosition(index, 12, "long"),
    );

    assert.equal(positions.filter(Boolean).length, 12);
    assert.equal(positions.filter((position) => position?.top === "26%").length, 6);
    assert.equal(positions.filter((position) => position?.top === "74%").length, 6);
  });

  it("lets the hall use its fluid CSS grid for any larger group", () => {
    assert.equal(tableSeatPosition(0, 13, "hall"), undefined);
    assert.equal(tableSeatPosition(49, 50, "hall"), undefined);
  });
});
