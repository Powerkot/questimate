const ID_KEY = "pp-player-id";
const TOKEN_KEY = "pp-token";
const NAME_KEY = "pp-name";
const LANG_KEY = "pp-lang";
const ROOM_KEY = "pp-last-room";

function randomPart(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

export function getOrCreateIdentity(): { playerId: string; token: string } {
  let playerId = localStorage.getItem(ID_KEY) || sessionStorage.getItem(ID_KEY);
  let token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  if (!playerId || !token) {
    playerId = `p_${randomPart()}`.slice(0, 24);
    token = `${randomPart()}${randomPart()}`.slice(0, 48);
  }
  localStorage.setItem(ID_KEY, playerId);
  localStorage.setItem(TOKEN_KEY, token);
  sessionStorage.removeItem(ID_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  return { playerId, token };
}

export function loadLastRoom(): string | null {
  const code = (localStorage.getItem(ROOM_KEY) || "").trim().toUpperCase();
  return /^[A-Z0-9]{5}$/.test(code) ? code : null;
}

export function saveLastRoom(code: string): void {
  const normalized = code.trim().toUpperCase();
  if (/^[A-Z0-9]{5}$/.test(normalized)) localStorage.setItem(ROOM_KEY, normalized);
}

export function clearLastRoom(code?: string): void {
  if (code && loadLastRoom() !== code.trim().toUpperCase()) return;
  localStorage.removeItem(ROOM_KEY);
}

export function loadName(): string {
  return localStorage.getItem(NAME_KEY) || "";
}

export function saveName(name: string): void {
  localStorage.setItem(NAME_KEY, name);
}

export function loadLang(): "ru" | "en" {
  return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ru";
}

export function saveLang(lang: "ru" | "en"): void {
  localStorage.setItem(LANG_KEY, lang);
}
