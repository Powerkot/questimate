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
  currentTask: string;
  taskTitlePh: string;
  taskDescPh: string;
  postTask: string;
  reveal: string;
  revote: string;
  resultLabel: string;
  saveResult: string;
  history: string;
  historyEmpty: string;
  historyVotesCount: (count: number) => string;
  historyAgreement: (percent: number) => string;
  historyCompleted: string;
  historyDescription: string;
  historyDecision: string;
  historyNoDescription: string;
  historyDistribution: string;
  historyIndividualVotes: string;
  historyEdgeVotes: string;
  historyMinimum: string;
  historyMaximum: string;
  historyFinalVsMajority: (result: string, majority: string) => string;
  historyCopy: string;
  historyCopied: string;
  historyReestimate: string;
  historyReestimateBlocked: string;
  historyClose: string;
  historyRoundsCount: (count: number) => string;
  historyRound: (number: number) => string;
  historyFinalizedBy: (name: string) => string;
  decisionNote: string;
  decisionNotePh: string;
  decisionNoteHint: string;
  send: string;
  sayPh: string;
  host: string;
  voted: string;
  waiting: string;
  away: string;
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
  roomViewMode: string;
  tableView: string;
  cardsView: string;
  tableCapacityHint: string;
  waitingForTask: string;
  chat: string;
  specialVotes: string;
  clearQuestion: string;
  breakRequested: string;
  revealHint: string;
  finalEstimate: string;
  questComplete: string;
  partyDecision: string;
  voteShowcaseTitle: string;
  majorityChose: string;
  minimumEstimate: string;
  maximumEstimate: string;
  collapseShowcase: string;
  expandShowcase: string;
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
    currentTask: "Текущая задача",
    taskTitlePh: "Название задачи",
    taskDescPh: "Описание. Длинный текст можно свернуть.",
    postTask: "Показать команде",
    reveal: "Открыть карты",
    revote: "Переголосовать",
    resultLabel: "Итог",
    saveResult: "Сохранить в историю",
    history: "История оценок",
    historyEmpty: "Пока пусто — итог появится после сохранения.",
    historyVotesCount: (count) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      const noun =
        mod10 === 1 && mod100 !== 11
          ? "голос"
          : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
            ? "голоса"
            : "голосов";
      return `${count} ${noun}`;
    },
    historyAgreement: (percent) => `Согласие ${percent}%`,
    historyCompleted: "Завершено",
    historyDescription: "Описание задачи",
    historyDecision: "Почему выбрали эту оценку",
    historyNoDescription: "Описание к этой задаче не добавляли.",
    historyDistribution: "Распределение голосов",
    historyIndividualVotes: "Голоса участников",
    historyEdgeVotes: "Крайние оценки",
    historyMinimum: "Минимальная",
    historyMaximum: "Максимальная",
    historyFinalVsMajority: (result, majority) =>
      `Итог ${result} отличается от выбора большинства — ${majority}.`,
    historyCopy: "Скопировать результат",
    historyCopied: "Результат скопирован",
    historyReestimate: "Оценить снова",
    historyReestimateBlocked: "Сначала завершите текущую задачу",
    historyClose: "Закрыть подробности",
    historyRoundsCount: (count) => {
      const mod10 = count % 10;
      const mod100 = count % 100;
      const noun =
        mod10 === 1 && mod100 !== 11
          ? "раунд"
          : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
            ? "раунда"
            : "раундов";
      return `${count} ${noun}`;
    },
    historyRound: (number) => `Раунд ${number}`,
    historyFinalizedBy: (name) => `Итог сохранил(а) ${name}`,
    decisionNote: "Комментарий к решению — необязательно",
    decisionNotePh:
      "Например: берём L, потому что интеграция уже готова, но нужен запас на миграцию.",
    decisionNoteHint: "Он сохранится в истории и напомнит команде, почему выбрали этот итог.",
    send: "Сказать",
    sayPh: "Сказать группе…",
    host: "ведущий",
    voted: "карта на столе",
    waiting: "думает",
    away: "отошёл",
    expand: "Подробнее",
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
    votedWhileMost: (name, vote, mode) => `${name} — ${vote}, большинство команды — ${mode}.`,
    connecting: "Входим в группу…",
    party: "группа",
    pickResult: "Выберите итог по шкале",
    createHint: "Начните новую оценку и пригласите команду ссылкой.",
    joinHint: "Или войдите по пятисимвольному коду комнаты.",
    roomCode: "Код комнаты",
    invited: (code) => `Вас пригласили в комнату ${code}`,
    demoTitle: "Посмотреть живую демо-комнату",
    demoText:
      "Готовая задача, команда, чат и история. Всё, что вы сделаете, останется только в этой вкладке.",
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
    roomViewMode: "Вид игроков",
    tableView: "Стол",
    cardsView: "Карты",
    tableCapacityHint: "Стол рассчитан на команды до 6 человек",
    waitingForTask: "Ждём, когда ведущий выставит следующий квест.",
    chat: "Чат",
    specialVotes: "Особые сигналы",
    clearQuestion: "Нужно уточнить задачу",
    breakRequested: "Команде нужна пауза",
    revealHint: "Карты останутся закрыты, пока вы не откроете стол.",
    finalEstimate: "Итоговая оценка",
    questComplete: "Квест завершён",
    partyDecision: "Решение команды",
    voteShowcaseTitle: "Итоги голосования",
    majorityChose: "Большинство выбрало",
    minimumEstimate: "Минимальная оценка",
    maximumEstimate: "Максимальная оценка",
    collapseShowcase: "Свернуть",
    expandShowcase: "Показать разбор оценок",
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
    currentTask: "Current task",
    taskTitlePh: "Task title",
    taskDescPh: "Description. Long text can be collapsed.",
    postTask: "Show to the team",
    reveal: "Reveal cards",
    revote: "Vote again",
    resultLabel: "Result",
    saveResult: "Save to history",
    history: "Estimate history",
    historyEmpty: "Empty for now — a result appears after you save.",
    historyVotesCount: (count) => `${count} ${count === 1 ? "vote" : "votes"}`,
    historyAgreement: (percent) => `${percent}% agreement`,
    historyCompleted: "Completed",
    historyDescription: "Task description",
    historyDecision: "Why this estimate was chosen",
    historyNoDescription: "No description was added to this task.",
    historyDistribution: "Vote distribution",
    historyIndividualVotes: "Individual votes",
    historyEdgeVotes: "Farthest estimates",
    historyMinimum: "Minimum",
    historyMaximum: "Maximum",
    historyFinalVsMajority: (result, majority) =>
      `The final estimate ${result} differs from the majority choice — ${majority}.`,
    historyCopy: "Copy result",
    historyCopied: "Result copied",
    historyReestimate: "Estimate again",
    historyReestimateBlocked: "Finish the current task first",
    historyClose: "Close details",
    historyRoundsCount: (count) => `${count} ${count === 1 ? "round" : "rounds"}`,
    historyRound: (number) => `Round ${number}`,
    historyFinalizedBy: (name) => `Finalized by ${name}`,
    decisionNote: "Decision note — optional",
    decisionNotePh:
      "For example: choosing L because the integration exists, but the migration needs a buffer.",
    decisionNoteHint: "It stays in history so the team remembers why this result was chosen.",
    send: "Say",
    sayPh: "Say to the party…",
    host: "host",
    voted: "card on the table",
    waiting: "thinking",
    away: "away",
    expand: "More details",
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
    connecting: "Joining the party…",
    party: "party",
    pickResult: "Pick a result on the scale",
    createHint: "Start a fresh estimate and invite the team with a link.",
    joinHint: "Or join an existing room with its five-character code.",
    roomCode: "Room code",
    invited: (code) => `You were invited to room ${code}`,
    demoTitle: "Explore a live demo room",
    demoText:
      "A ready task, party, chat and history. Everything you do stays only in this browser tab.",
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
    roomViewMode: "Player view",
    tableView: "Table",
    cardsView: "Cards",
    tableCapacityHint: "The illustrated table seats parties of up to 6",
    waitingForTask: "Waiting for the host to post the next quest.",
    chat: "Chat",
    specialVotes: "Special signals",
    clearQuestion: "The task needs clarification",
    breakRequested: "The party needs a break",
    revealHint: "Cards stay hidden until you open the table.",
    finalEstimate: "Final estimate",
    questComplete: "Quest complete",
    partyDecision: "The party has decided",
    voteShowcaseTitle: "Voting results",
    majorityChose: "Most players chose",
    minimumEstimate: "Minimum estimate",
    maximumEstimate: "Maximum estimate",
    collapseShowcase: "Collapse",
    expandShowcase: "Show vote breakdown",
  },
};

export function chatText(entry: { text: string; textEn?: string }, lang: Lang): string {
  if (lang === "en" && entry.textEn) return entry.textEn;
  return entry.text;
}
