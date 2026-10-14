// Individual 256px portraits supplied for the circular character picker.
const PEOPLE = Array.from({ length: 16 }, (_, index) => ({
  id: `portrait-${String(index + 1).padStart(2, "0")}`,
  art: `/avatars/characters-v2/avatar-${String(index + 1).padStart(2, "0")}.webp`,
  position: "center",
}));
export const CHARACTERS = [
  ...PEOPLE,
  ...["dragon", "zombie", "ghoul", "phoenix", "unicorn", "griffin", "minotaur", "treant"].map((name) => ({
    id: `creature-${name}`,
    art: `/avatars/creatures-v1/${name}.webp`,
    position: "center",
  })),
];
export const PLAYER_TITLES = [
  { id: "bugs", ru: "Укротитель багов", en: "Bug Tamer" },
  { id: "oracle", ru: "Оракул оценок", en: "Oracle of Estimates" },
  { id: "deploy", ru: "Рыцарь деплоя", en: "Knight of Deploys" },
  { id: "refactor", ru: "Маг рефакторинга", en: "Refactoring Mage" },
  { id: "backlog", ru: "Хранитель бэклога", en: "Backlog Keeper" },
  { id: "deadlines", ru: "Повелитель дедлайнов", en: "Lord of Deadlines" },
  { id: "table", ru: "Хранитель стола", en: "Keeper of the Table" },
] as const;
export type PlayerAppearance = { avatarId?: string; titleId?: string | null; spectator?: boolean };
export function validAvatar(id: unknown): id is string {
  return CHARACTERS.some((character) => character.id === id);
}
export function validTitle(id: unknown): boolean {
  return id === null || id === undefined || PLAYER_TITLES.some((title) => title.id === id);
}
export function availableCharacters(
  players: {
    id: string;
    avatarId?: string;
    kickedAt?: number;
    leftAt?: number;
    spectator?: boolean;
  }[],
  exceptId?: string,
): string[] {
  const taken = new Set(
    players
      .filter((p) => p.id !== exceptId && !p.kickedAt && !p.leftAt && !p.spectator)
      .map((p) => p.avatarId),
  );
  return CHARACTERS.filter((c) => !taken.has(c.id)).map((c) => c.id);
}
