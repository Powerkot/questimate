import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeHistoryVotes } from "./history.ts";

describe("history vote analysis", () => {
  it("summarizes agreement, median, range and grouped voters", () => {
    const result = analyzeHistoryVotes([
      { name: "Olga", value: "m" },
      { name: "Max", value: "xl" },
      { name: "Anna", value: "l" },
      { name: "Ilya", value: "l" },
      { name: "Katya", value: "s" },
    ]);

    assert.equal(result.totalVotes, 5);
    assert.equal(result.mode, "l");
    assert.equal(result.consensusPct, 40);
    assert.equal(result.median, "l");
    assert.equal(result.range, "s–xl");
    assert.deepEqual(result.minimum, { value: "s", names: ["Katya"] });
    assert.deepEqual(result.maximum, { value: "xl", names: ["Max"] });
    assert.deepEqual(result.groups.find((group) => group.value === "l")?.names, ["Anna", "Ilya"]);
  });

  it("keeps question and break votes outside numeric agreement", () => {
    const result = analyzeHistoryVotes([
      { name: "Olga", value: "s" },
      { name: "Max", value: "s" },
      { name: "Anna", value: "?" },
      { name: "Ilya", value: "☕" },
    ]);

    assert.equal(result.mode, "s");
    assert.equal(result.consensusPct, 100);
    assert.equal(result.specialVotes, 2);
    assert.equal(result.totalVotes, 4);
  });

  it("ignores invalid legacy values instead of breaking the history view", () => {
    const result = analyzeHistoryVotes([
      { name: "Olga", value: "s" },
      { name: "Unknown", value: "13" },
    ]);

    assert.equal(result.totalVotes, 1);
    assert.equal(result.mode, "s");
    assert.equal(result.range, "s");
  });
});
