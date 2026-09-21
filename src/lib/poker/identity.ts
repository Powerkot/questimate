const ID_KEY = "pp-player-id";
const TOKEN_KEY = "pp-token";
const NAME_KEY = "pp-name";
const LANG_KEY = "pp-lang";

function randomPart(): string {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("");
}

export function getOrCreateIdentity(): { playerId: string; token: string } {
  let playerId = sessionStorage.getItem(ID_KEY);
  let token = sessionStorage.getItem(TOKEN_KEY);
  if (!playerId || !token) {
    playerId = `p_${randomPart()}`.slice(0, 24);
    token = `${randomPart()}${randomPart()}`.slice(0, 48);
    sessionStorage.setItem(ID_KEY, playerId);
    sessionStorage.setItem(TOKEN_KEY, token);
  }
  return { playerId, token };
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
