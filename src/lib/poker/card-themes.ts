// Numbers refer to the approved twenty-card concept sheet.
export const DECK_THEMES = ["01", "03", "07", "09", "12", "13", "17", "18", "20"] as const;
export type DeckThemeId = (typeof DECK_THEMES)[number];
export function isDeckTheme(value: unknown): value is DeckThemeId {
  return DECK_THEMES.some((theme) => theme === value);
}
export function initialDeckTheme(code: string): DeckThemeId {
  const seed = Array.from(code).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return DECK_THEMES[seed % DECK_THEMES.length];
}
export function nextDeckTheme(current: DeckThemeId): DeckThemeId {
  return DECK_THEMES[(DECK_THEMES.indexOf(current) + 1) % DECK_THEMES.length];
}

export const THEME_NAMES: Record<DeckThemeId, string> = {
  "01": "Иллюминированная рукопись",
  "03": "Резная слоновая кость",
  "07": "Витраж звёздного собора",
  "09": "Лунный опал",
  "12": "Нефритовый сад",
  "13": "Карта созвездий",
  "17": "Золотое солнце",
  "18": "Ледяной кристалл",
  "20": "Портал хранителей",
};
