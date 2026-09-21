import type { CardValue } from "./types";
import type { Lang } from "./i18n";

export type CardLore = {
  art: string;
  name: Record<Lang, string>;
  title: Record<Lang, string>;
  epic?: boolean;
};

export const CARD_BACK = "/cards/back.jpg";

export const CARD_LORE: Record<CardValue, CardLore> = {
  xs: {
    art: "/cards/xs.jpg",
    name: { ru: "Кнопыш Шмыг", en: "Knopysh Shmyg" },
    title: { ru: "крошечная задача", en: "a tiny task" },
  },
  s: {
    art: "/cards/s.jpg",
    name: { ru: "Паж Поспевай", en: "Page Posthaste" },
    title: { ru: "лёгкая и быстрая", en: "light and quick" },
  },
  m: {
    art: "/cards/m.jpg",
    name: { ru: "Мастер Ровнорук", en: "Master Evenhand" },
    title: { ru: "ровная работа", en: "a balanced job" },
  },
  l: {
    art: "/cards/l.jpg",
    name: { ru: "Рыцарь Основательный", en: "Knight Steadfast" },
    title: { ru: "крепкий объём", en: "solid volume" },
  },
  xl: {
    art: "/cards/xl.jpg",
    name: { ru: "Лорд Громобой", en: "Lord Thunderblow" },
    title: { ru: "тяжёлая и крупная", en: "heavy and large" },
    epic: true,
  },
  XXL: {
    art: "/cards/xxl.jpg",
    name: { ru: "Король Перегруза", en: "King Overload" },
    title: { ru: "почти босс", en: "almost a boss" },
    epic: true,
  },
  "?": {
    art: "/cards/unknown.jpg",
    name: { ru: "Оракул Туманник", en: "Oracle Mistveil" },
    title: { ru: "слишком туманно", en: "too foggy still" },
  },
  "☕": {
    art: "/cards/coffee.jpg",
    name: { ru: "Трактирщик Бодрин", en: "Innkeeper Cheer" },
    title: { ru: "пора на паузу", en: "time for a break" },
  },
};

export function cardLore(value: string | null | undefined): CardLore | null {
  if (!value) return null;
  return CARD_LORE[value as CardValue] ?? null;
}
