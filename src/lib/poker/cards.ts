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

export const CARD_BACKS = [
  { id: "royal-star", art: "/cards/back.jpg" },
  { id: "tavern-compass", art: "/cards/v2/back-tavern.jpg" },
] as const;

export const DEFAULT_CARD_BACK_ID = CARD_BACKS[0].id;

export function cardBackIds(): string[] {
  return CARD_BACKS.map((back) => back.id);
}

export function cardBackArt(backId?: string | null): string {
  return CARD_BACKS.find((back) => back.id === backId)?.art ?? CARD_BACKS[0].art;
}

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
      {
        id: "s-skvair-shustrik",
        art: "/cards/v2/s-skvair-shustrik.jpg",
        name: { ru: "Сквайр Шустрик", en: "Squire Swift" },
        title: { ru: "быстрое поручение", en: "a quick errand" },
      },
      {
        id: "s-yunga-shmyg",
        art: "/cards/v2/s-yunga-shmyg.jpg",
        name: { ru: "Юнга Шмыг", en: "Deckhand Dash" },
        title: { ru: "лёгкая доставка", en: "a light delivery" },
      },
      {
        id: "s-bystrik-ladnyi",
        art: "/cards/v2/s-bystrik-ladnyi.jpg",
        name: { ru: "Быстрик Ладный", en: "Quickfoot Neat" },
        title: { ru: "быстро и аккуратно", en: "quick and tidy" },
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
      {
        id: "m-remeslennik-ladomir",
        art: "/cards/v2/m-remeslennik-ladomir.jpg",
        name: { ru: "Ремесленник Ладомир", en: "Craftsman Steadyhand" },
        title: { ru: "надёжная работа", en: "dependable work" },
      },
      {
        id: "m-master-bez-khlopot",
        art: "/cards/v2/m-master-bez-khlopot.jpg",
        name: { ru: "Мастер Без-Хлопот", en: "Master No-Trouble" },
        title: { ru: "знакомый объём", en: "familiar scope" },
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
      {
        id: "l-ser-dobrotyazh",
        art: "/cards/v2/l-ser-dobrotyazh.jpg",
        name: { ru: "Сэр Добротяж", en: "Sir Stoutwork" },
        title: { ru: "добротная большая работа", en: "a sturdy large task" },
      },
      {
        id: "l-strazh-nadezhin",
        art: "/cards/v2/l-strazh-nadezhin.jpg",
        name: { ru: "Страж Надёжин", en: "Guard Steadfast" },
        title: { ru: "серьёзный надёжный объём", en: "serious dependable scope" },
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
      {
        id: "xl-baron-tyazhedum",
        art: "/cards/v2/xl-baron-tyazhedum.jpg",
        name: { ru: "Барон Тяжедум", en: "Baron Gravethought" },
        title: { ru: "тяжёлое решение", en: "a weighty undertaking" },
      },
      {
        id: "xl-velikan-shiroplech",
        art: "/cards/v2/xl-velikan-shiroplech.jpg",
        name: { ru: "Великан Широплеч", en: "Giant Broadshoulder" },
        title: { ru: "огромный объём", en: "enormous scope" },
      },
      {
        id: "xl-arkhimag-neprostoi",
        art: "/cards/v2/xl-arkhimag-neprostoi.jpg",
        name: { ru: "Архимаг Непростой", en: "Archmage Intricate" },
        title: { ru: "сложная большая задача", en: "a complex large task" },
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
