import type { CardValue } from "./types.ts";
import type { Lang } from "./i18n.ts";

export type CardVariant = {
  id: string;
  art: string;
  name: Record<Lang, string>;
  title: Record<Lang, string>;
};

export type CardLore = {
  variants: CardVariant[];
  epic?: boolean;
};

export const CARD_BACK = "/cards/back.jpg";

export const CARD_LORE: Record<CardValue, CardLore> = {
  xs: {
    variants: [
      {
        id: "xs-knopysh-shmyg",
        art: "/cards/v2/xs-knopysh-shmyg.jpg",
        name: { ru: "Кнопыш Шмыг", en: "Knopysh Shmyg" },
        title: { ru: "крошечная задача", en: "a tiny task" },
      },
    ],
  },
  s: {
    variants: [
      {
        id: "s-pazh-pospevai",
        art: "/cards/v2/s-pazh-pospevai.jpg",
        name: { ru: "Паж Поспевай", en: "Page Posthaste" },
        title: { ru: "лёгкая и быстрая", en: "light and quick" },
      },
    ],
  },
  m: {
    variants: [
      {
        id: "m-master-rovnoruk",
        art: "/cards/v2/m-master-rovnoruk.jpg",
        name: { ru: "Мастер Ровнорук", en: "Master Evenhand" },
        title: { ru: "ровная работа", en: "a balanced job" },
      },
      {
        id: "m-sledopyt-vernyak",
        art: "/cards/v2/m-sledopyt-vernyak.jpg",
        name: { ru: "Следопыт Верняк", en: "Suretrack Ranger" },
        title: { ru: "уверенный средний путь", en: "a confident middle path" },
      },
    ],
  },
  l: {
    variants: [
      {
        id: "l-rytsar-osnovatelny",
        art: "/cards/v2/l-rytsar-osnovatelny.jpg",
        name: { ru: "Рыцарь Основательный", en: "Knight Steadfast" },
        title: { ru: "крепкий объём", en: "solid volume" },
      },
      {
        id: "l-kapitan-skladny",
        art: "/cards/v2/l-kapitan-skladny.jpg",
        name: { ru: "Капитан Складный", en: "Captain Wellplanned" },
        title: { ru: "заметный, управляемый объём", en: "substantial, manageable work" },
      },
    ],
  },
  xl: {
    variants: [
      {
        id: "xl-lord-gromoboy",
        art: "/cards/v2/xl-lord-gromoboy.jpg",
        name: { ru: "Лорд Громобой", en: "Lord Thunderblow" },
        title: { ru: "тяжёлая и крупная", en: "heavy and large" },
      },
    ],
    epic: true,
  },
  XXL: {
    variants: [
      {
        id: "xxl-korol-peregruza",
        art: "/cards/v2/xxl-korol-peregruza.jpg",
        name: { ru: "Король Перегруза", en: "King Overload" },
        title: { ru: "почти босс", en: "almost a boss" },
      },
    ],
    epic: true,
  },
  "?": {
    variants: [
      {
        id: "unknown-orakul-tumannnik",
        art: "/cards/v2/unknown-orakul-tumannnik.jpg",
        name: { ru: "Оракул Туманник", en: "Oracle Mistveil" },
        title: { ru: "не хватает ясности", en: "not enough clarity" },
      },
    ],
  },
  "☕": {
    variants: [
      {
        id: "coffee-traktirshchik-bodrin",
        art: "/cards/v2/coffee-traktirshchik-bodrin.jpg",
        name: { ru: "Трактирщик Бодрин", en: "Innkeeper Cheer" },
        title: { ru: "пора на паузу", en: "time for a break" },
      },
    ],
  },
};

export function cardLore(
  value: string | null | undefined,
  variantId?: string | null,
): (CardVariant & { epic?: boolean }) | null {
  if (!value) return null;
  const lore = CARD_LORE[value as CardValue];
  if (!lore) return null;
  const variant = lore.variants.find((item) => item.id === variantId) ?? lore.variants[0];
  return { ...variant, epic: lore.epic };
}

export function cardVariantIds(value: CardValue): string[] {
  return CARD_LORE[value].variants.map((variant) => variant.id);
}
