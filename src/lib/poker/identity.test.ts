import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import {
  clearLastRoom,
  getOrCreateIdentity,
  loadLastRoom,
  loadRoomView,
  saveLastRoom,
  saveRoomView,
} from "./identity.ts";

class MemoryStorage implements Storage {
  #values = new Map<string, string>();

  get length(): number {
    return this.#values.size;
  }

  clear(): void {
    this.#values.clear();
  }

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  key(index: number): string | null {
    return [...this.#values.keys()][index] ?? null;
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, String(value));
  }
}

const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
const originalSessionStorage = Object.getOwnPropertyDescriptor(globalThis, "sessionStorage");

before(() => {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
  Object.defineProperty(globalThis, "sessionStorage", {
    configurable: true,
    value: new MemoryStorage(),
  });
});

after(() => {
  if (originalLocalStorage) Object.defineProperty(globalThis, "localStorage", originalLocalStorage);
  else delete (globalThis as { localStorage?: Storage }).localStorage;
  if (originalSessionStorage)
    Object.defineProperty(globalThis, "sessionStorage", originalSessionStorage);
  else delete (globalThis as { sessionStorage?: Storage }).sessionStorage;
});

describe("poker browser identity", () => {
  it("migrates the old tab identity into durable browser storage", () => {
    sessionStorage.setItem("pp-player-id", "player_legacy");
    sessionStorage.setItem("pp-token", "legacy-secret-token");

    assert.deepEqual(getOrCreateIdentity(), {
      playerId: "player_legacy",
      token: "legacy-secret-token",
    });
    assert.equal(localStorage.getItem("pp-player-id"), "player_legacy");
    assert.equal(localStorage.getItem("pp-token"), "legacy-secret-token");
    assert.equal(sessionStorage.getItem("pp-player-id"), null);
  });

  it("remembers and clears only the matching last room", () => {
    saveLastRoom("abcde");
    assert.equal(loadLastRoom(), "ABCDE");

    clearLastRoom("ZZZZZ");
    assert.equal(loadLastRoom(), "ABCDE");

    clearLastRoom("ABCDE");
    assert.equal(loadLastRoom(), null);
  });

  it("remembers the participant's visual mode in this browser", () => {
    assert.equal(loadRoomView(), "table");
    saveRoomView("cards");
    assert.equal(loadRoomView(), "cards");
    saveRoomView("table");
    assert.equal(loadRoomView(), "table");
  });
});
