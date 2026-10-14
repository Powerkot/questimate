import { useEffect, useRef, useState } from "react";
import { CHARACTERS, availableCharacters } from "@/lib/poker/player-profile";
import { pokerCharactersFn } from "@/lib/poker/actions";
import { getOrCreateIdentity } from "@/lib/poker/identity";
import { buildDemoRoom } from "@/lib/poker/demo";
import { normalizeRoom } from "@/lib/poker/engine";
import type { Lang } from "@/lib/poker/i18n";

export function CharacterPicker({
  code,
  password,
  value,
  onChange,
  onReady,
  lang,
  refreshKey,
}: {
  code?: string;
  password?: string;
  value: string;
  onChange: (id: string) => void;
  onReady: (ready: boolean) => void;
  lang: Lang;
  refreshKey: string | null;
}) {
  const selected = useRef(value);
  useEffect(() => {
    selected.current = value;
  }, [value]);
  const [available, setAvailable] = useState<string[] | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    let disposed = false;
    setAvailable(null);
    onReady(false);
    const update = async () => {
      if (code !== undefined && !/^[A-Z0-9]{5}$/.test(code)) {
        setProblem("code");
        return;
      }
      if (password && password.length < 4) {
        setProblem("password_required");
        return;
      }
      try {
        const result = !code
          ? { ok: true as const, available: CHARACTERS.map((c) => c.id) }
          : code === "RAID1"
            ? {
                ok: true as const,
                available: availableCharacters(normalizeRoom(buildDemoRoom()).players),
              }
            : await pokerCharactersFn({
                data: { code, password: password || undefined, ...getOrCreateIdentity() },
              });
        if (disposed) return;
        if (!result.ok) {
          setProblem(result.error);
          setAvailable(null);
          onReady(false);
          return;
        }
        setProblem(null);
        setAvailable(result.available);
        if (!result.available.includes(selected.current)) onChange(result.available[0] ?? "");
        onReady(result.available.length > 0);
      } catch {
        if (!disposed) {
          setProblem("network");
          onReady(false);
        }
      }
    };
    const timeout = window.setTimeout(() => void update(), 300);
    const interval =
      code && code !== "RAID1" ? window.setInterval(() => void update(), 3000) : undefined;
    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, [code, password, onChange, onReady, refreshKey]);
  const ru = lang === "ru";
  const status =
    problem === "code"
      ? ru
        ? "Сначала введите код комнаты"
        : "Enter the room code first"
      : problem === "password_required" || problem === "wrong_password"
        ? ru
          ? "Введите верный пароль комнаты, чтобы увидеть свободных персонажей"
          : "Enter the room password to see available characters"
        : problem === "room_not_found"
          ? ru
            ? "Комната не найдена"
            : "Room not found"
          : problem
            ? ru
              ? "Не удалось проверить свободных персонажей"
              : "Could not check available characters"
            : !available
              ? ru
                ? "Проверяем свободных персонажей…"
                : "Checking available characters…"
              : available.length
                ? ru
                  ? "Занятые персонажи недоступны"
                  : "Taken characters are unavailable"
                : ru
                  ? "Все персонажи заняты"
                  : "All characters are taken";
  return (
    <fieldset className="character-picker">
      <legend className="field-label">{ru ? "Ваш персонаж" : "Your character"}</legend>
      <p className="form-hint" role="status">
        {status}
      </p>
      <div className="character-options">
        {CHARACTERS.map((character, index) => {
          const taken = available !== null && !available.includes(character.id);
          return (
            <button
              key={character.id}
              type="button"
              disabled={!available || taken}
              aria-pressed={value === character.id && !taken}
              aria-label={`${ru ? "Персонаж" : "Character"} ${index + 1}${taken ? (ru ? " — занят" : " — taken") : ""}`}
              onClick={() => onChange(character.id)}
            >
              <span
                className="character-face"
                aria-hidden="true"
                style={{
                  backgroundImage: `url(${character.art})`,
                  backgroundPosition: character.position,
                }}
              />
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
