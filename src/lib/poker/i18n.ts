import { APP_DOMAIN } from "@/lib/brand";

export type Lang = "ru" | "en";

type Dict = {
  kicker: string;
  lede: string;
  yourName: string;
  createPassword: string;
  joinPassword: string;
  passwordPlaceholder: string;
  passwordHint: string;
  roomLifetime: string;
  passwordRequired: string;
  wrongPassword: string;
  passwordTooShort: string;
  protectedRoom: string;
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
  createHint: string;
  joinHint: string;
  roomCode: string;
  invited: (code: string) => string;
  demoTitle: string;
  demoText: string;
  tryDemo: string;
  nameRequired: string;
  invalidRoom: string;
  actionFailed: string;
  leave: string;
  presentation: string;
  exitPresentation: string;
  chooseCard: string;
  chooseCardHint: string;
  voteSaving: string;
  voteSaved: string;
  voteFailed: string;
  team: string;
  allVoted: string;
  waitingForTask: string;
  chat: string;
  specialVotes: string;
  clearQuestion: string;
  breakRequested: string;
  revealHint: string;
  finalEstimate: string;
};

export const I18N: Record<Lang, Dict> = {
  ru: {
    kicker: APP_DOMAIN,
    lede: "Оцените задачу вместе. Пока ведущий не откроет стол, карты лежат рубашкой вверх.",
    yourName: "Ваше имя",
    createPassword: "Пароль новой комнаты — необязательно",
    joinPassword: "Пароль комнаты — если установлен",
    passwordPlaceholder: "Минимум 4 символа",
    passwordHint: "Сам пароль не хранится — только защищённый хеш.",
    roomLifetime: "Комната и вся её история удаляются через 24 часа после создания.",
    passwordRequired: "Эта комната защищена паролем.",
    wrongPassword: "Неверный пароль комнаты.",
    passwordTooShort: "Пароль должен содержать не менее 4 символов.",
    protectedRoom: "Комната защищена паролем",
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
    createHint: "Начните новую оценку и пригласите команду ссылкой.",
    joinHint: "Или войдите по пятисимвольному коду комнаты.",
    roomCode: "Код комнаты",
    invited: (code) => `Вас пригласили в комнату ${code}`,
    demoTitle: "Посмотреть живую демо-комнату",
    demoText: "Готовая задача, команда и раскрытые карты. Вход только по вашему нажатию.",
    tryDemo: "Войти в RAID1",
    nameRequired: "Сначала укажите имя, под которым вас увидит команда.",
    invalidRoom: "Введите пятисимвольный код комнаты.",
    actionFailed: "Не удалось сохранить действие. Проверьте соединение и повторите.",
    leave: "Выйти",
    presentation: "На экран",
    exitPresentation: "Вернуть управление",
    chooseCard: "Ваша колода",
    chooseCardHint: "Выберите оценку — до раскрытия её видите только вы.",
    voteSaving: "Сохраняем карту…",
    voteSaved: "Карта лежит на столе",
    voteFailed: "Карта не сохранилась — попробуйте ещё раз",
    team: "Команда у стола",
    allVoted: "Все готовы",
    waitingForTask: "Ждём, когда ведущий выставит следующий квест.",
    chat: "Чат",
    specialVotes: "Особые сигналы",
    clearQuestion: "Нужно уточнить задачу",
    breakRequested: "Команде нужна пауза",
    revealHint: "Карты останутся закрыты, пока вы не откроете стол.",
    finalEstimate: "Итоговая оценка",
  },
  en: {
    kicker: APP_DOMAIN,
    lede: "Estimate together. Cards stay face-down until the host opens the table.",
    yourName: "Your name",
    createPassword: "New room password — optional",
    joinPassword: "Room password — if protected",
    passwordPlaceholder: "At least 4 characters",
    passwordHint: "The password itself is never stored — only a secure hash.",
    roomLifetime: "The room and its entire history are deleted 24 hours after creation.",
    passwordRequired: "This room is password-protected.",
    wrongPassword: "Incorrect room password.",
    passwordTooShort: "A password must contain at least 4 characters.",
    protectedRoom: "Password-protected room",
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
    createHint: "Start a fresh estimate and invite the team with a link.",
    joinHint: "Or join an existing room with its five-character code.",
    roomCode: "Room code",
    invited: (code) => `You were invited to room ${code}`,
    demoTitle: "Explore a live demo room",
    demoText: "A ready task, party and revealed cards. You only enter when you choose to.",
    tryDemo: "Enter RAID1",
    nameRequired: "Enter the name your team should see first.",
    invalidRoom: "Enter a five-character room code.",
    actionFailed: "The action was not saved. Check the connection and try again.",
    leave: "Leave",
    presentation: "Present",
    exitPresentation: "Return controls",
    chooseCard: "Your deck",
    chooseCardHint: "Pick an estimate — only you can see it before reveal.",
    voteSaving: "Placing your card…",
    voteSaved: "Your card is on the table",
    voteFailed: "The card was not saved — try again",
    team: "Party at the table",
    allVoted: "Everyone is ready",
    waitingForTask: "Waiting for the host to post the next quest.",
    chat: "Chat",
    specialVotes: "Special signals",
    clearQuestion: "The task needs clarification",
    breakRequested: "The party needs a break",
    revealHint: "Cards stay hidden until you open the table.",
    finalEstimate: "Final estimate",
  },
};

export function chatText(entry: { text: string; textEn?: string }, lang: Lang): string {
  if (lang === "en" && entry.textEn) return entry.textEn;
  return entry.text;
}
