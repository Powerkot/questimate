import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { canUseTable, tableSeatAssignments } from "./table-layout.ts";

describe("poker table layout", () => {
  it("uses the illustrated table only for parties of up to six", () => {
    assert.equal(canUseTable(1), true);
    assert.equal(canUseTable(6), true);
    assert.equal(canUseTable(7), false);
    assert.equal(canUseTable(50), false);
  });

  it("keeps the viewer at the bottom seat", () => {
    const assignments = tableSeatAssignments(["host", "a", "viewer", "b", "c", "d"], "viewer");

    assert.equal(assignments.length, 6);
    assert.deepEqual(assignments.at(-1), { playerId: "viewer", slot: 3 });
    assert.equal(new Set(assignments.map(({ slot }) => slot)).size, 6);
  });

  it("distributes smaller parties symmetrically", () => {
    assert.deepEqual(tableSeatAssignments(["a", "viewer"], "viewer"), [
      { playerId: "a", slot: 0 },
      { playerId: "viewer", slot: 3 },
    ]);
    assert.deepEqual(tableSeatAssignments(["a", "b", "viewer"], "viewer"), [
      { playerId: "a", slot: 5 },
      { playerId: "b", slot: 1 },
      { playerId: "viewer", slot: 3 },
    ]);
  });

  it("leaves larger parties to the cards grid", () => {
    assert.deepEqual(tableSeatAssignments(["a", "b", "c", "d", "e", "f", "viewer"], "viewer"), []);
  });
});
