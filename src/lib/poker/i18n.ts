import { APP_DOMAIN } from "@/lib/brand";

export type Lang = "ru" | "en";

type Dict = {
  kicker: string;
  lede: string;
  yourName: string;
  create: string;
  join: string;
  copy: string;
  copied: string;
  noTask: string;
  newTask: string;
  taskTitlePh: string;
  taskDescPh: string;
  postTask: string;
  reveal: string;
  revote: string;
  resultLabel: string;
  saveResult: string;
  history: string;
  historyEmpty: string;
  send: string;
  sayPh: string;
  host: string;
  voted: string;
  waiting: string;
  expand: string;
  collapse: string;
  snow: string;
  roomMissing: string;
  votesOf: (a: number, b: number) => string;
  consensus: string;
  median: string;
  mean: string;
  range: string;
  consensusLevel: string;
  outliers: string;
  mode: string;
  levelHigh: string;
  levelMedium: string;
  levelLow: string;
  none: string;
  noSizedVotes: string;
  allAgree: string;
  votedWhileMost: (name: string, vote: string, mode: string) => string;
  askOutliers: string;
  connecting: string;
  party: string;
  pickResult: string;
};

export const I18N: Record<Lang, Dict> = {
  ru: {
    kicker: APP_DOMAIN,
    lede: "Оцените задачу вместе. Пока ведущий не откроет стол, карты лежат рубашкой вверх.",
    yourName: "Ваше имя",
    create: "Создать комнату",
    join: "Войти",
    copy: "копировать ссылку",
    copied: "Ссылка скопирована",
    noTask: "Ведущий ещё не выставил задачу",
    newTask: "Новая задача",
    taskTitlePh: "Название задачи",
    taskDescPh: "Описание. Длинный текст можно свернуть.",
    postTask: "Показать команде",
    reveal: "Открыть карты",
    revote: "Переголосовать",
    resultLabel: "Итог",
    saveResult: "Сохранить в историю",
    history: "История оценок",
    historyEmpty: "Пока пусто — итог появится после сохранения.",
    send: "Сказать",
    sayPh: "Сказать группе…",
    host: "ведущий",
    voted: "карта на столе",
    waiting: "думает",
    expand: "Развернуть",
    collapse: "Свернуть",
    snow: "Бросить снежок",
    roomMissing: "Комната не найдена",
    votesOf: (a, b) => `Голосов: ${a} / ${b}`,
    consensus: "Согласие команды",
    median: "медиана",
    mean: "среднее",
    range: "диапазон",
    consensusLevel: "уровень согласия",
    outliers: "крайние оценки",
    mode: "чаще всего",
    levelHigh: "высокий",
    levelMedium: "средний",
    levelLow: "низкий",
    none: "нет",
    noSizedVotes: "Для картины согласия нужны оценки размера, не только ? и ☕.",
    allAgree: "Команда сошлась на одной оценке.",
    votedWhileMost: (name, vote, mode) =>
      `У ${name} — ${vote}, тогда как у большинства команды — ${mode}.`,
    askOutliers: "Сначала обсудить крайние оценки",
    connecting: "Входим в группу…",
    party: "группа",
    pickResult: "Выберите итог по шкале",
  },
  en: {
    kicker: APP_DOMAIN,
    lede: "Estimate together. Cards stay face-down until the host opens the table.",
    yourName: "Your name",
    create: "Create room",
    join: "Join",
    copy: "copy link",
    copied: "Link copied",
    noTask: "The host has not posted a task yet",
    newTask: "New task",
    taskTitlePh: "Task title",
    taskDescPh: "Description. Long text can be collapsed.",
    postTask: "Show to the team",
    reveal: "Reveal cards",
    revote: "Vote again",
    resultLabel: "Result",
    saveResult: "Save to history",
    history: "Estimate history",
    historyEmpty: "Empty for now — a result appears after you save.",
    send: "Say",
    sayPh: "Say to the party…",
    host: "host",
    voted: "card on the table",
    waiting: "thinking",
    expand: "Expand",
    collapse: "Collapse",
    snow: "Throw a snowball",
    roomMissing: "Room not found",
    votesOf: (a, b) => `Votes: ${a} / ${b}`,
    consensus: "Team agreement",
    median: "median",
    mean: "mean",
    range: "range",
    consensusLevel: "agreement level",
    outliers: "farthest estimates",
    mode: "most common",
    levelHigh: "high",
    levelMedium: "medium",
    levelLow: "low",
    none: "none",
    noSizedVotes: "Size votes are needed for the picture — not only ? and ☕.",
    allAgree: "The team landed on the same estimate.",
    votedWhileMost: (name, vote, mode) =>
      `${name} chose ${vote}, while most of the team chose ${mode}.`,
    askOutliers: "Discuss the farthest estimates first",
    connecting: "Joining the party…",
    party: "party",
    pickResult: "Pick a result on the scale",
  },
};

export function chatText(entry: { text: string; textEn?: string }, lang: Lang): string {
  if (lang === "en" && entry.textEn) return entry.textEn;
  return entry.text;
}
