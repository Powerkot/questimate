import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashRoomPassword, verifyRoomPassword } from "./password.server.ts";

describe("room passwords", () => {
  it("stores a salted hash instead of the room password", async () => {
    const password = "secret tavern phrase";
    const first = await hashRoomPassword(password);
    const second = await hashRoomPassword(password);

    assert.notEqual(first.hash, password);
    assert.notEqual(first.hash, second.hash);
    assert.notEqual(first.salt, second.salt);
    assert.equal(await verifyRoomPassword(password, first), true);
    assert.equal(await verifyRoomPassword("wrong password", first), false);
  });
});
