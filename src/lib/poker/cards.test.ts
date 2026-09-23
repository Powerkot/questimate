import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cardFaceLabel } from "./cards.ts";

describe("cardFaceLabel", () => {
  it("renders every size and size interval in uppercase", () => {
    assert.equal(cardFaceLabel("xs"), "XS");
    assert.equal(cardFaceLabel("XXL"), "XXL");
    assert.equal(cardFaceLabel("s–m"), "S–M");
    assert.equal(cardFaceLabel("s–XXL"), "S–XXL");
  });

  it("keeps special estimates unchanged", () => {
    assert.equal(cardFaceLabel("?"), "?");
    assert.equal(cardFaceLabel("☕"), "☕");
    assert.equal(cardFaceLabel("—"), "—");
  });
});
