import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { RoomPassword } from "./types";

const scrypt = promisify(scryptCallback);
const KEY_LENGTH = 32;

export async function hashRoomPassword(password: string): Promise<RoomPassword> {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return {
    salt: salt.toString("base64url"),
    hash: hash.toString("base64url"),
  };
}

export async function verifyRoomPassword(password: string, stored: RoomPassword): Promise<boolean> {
  try {
    const salt = Buffer.from(stored.salt, "base64url");
    const expected = Buffer.from(stored.hash, "base64url");
    const actual = (await scrypt(password, salt, expected.length)) as Buffer;
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  } catch {
    return false;
  }
}
