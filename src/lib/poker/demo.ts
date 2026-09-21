import {
  DEMO_CODE,
  DEMO_SNOW_AFTER_MS,
  makeId,
  now,
  randomCardBackId,
  selectVariantId,
  throwSnowball,
} from "./engine.ts";
import type { CardValue, ChatEntry, HistoryEntry, StoredPlayer, StoredRoom } from "./types.ts";

export const DEMO_BOTS: { id: string; name: string; token: string; vote: CardValue }[] = [
  { id: "botolga", name: "Ольга", token: "demo-token-olga", vote: "s" },
  { id: "botmax1", name: "Максим", token: "demo-token-max1", vote: "XXL" },
  { id: "botanna", name: "Анна", token: "demo-token-anna", vote: "s" },
  { id: "botilya", name: "Илья", token: "demo-token-ilya", vote: "m" },
  { id: "botkaty", name: "Катя", token: "demo-token-katy", vote: "s" },
];

const DEMO_TASK = {
  id: "t-demo-now",
  title: "Нагрузка на платёжный шлюз при Black Friday",
  description:
    "Оцените работу на пике: x12 к обычному трафику, очередь ретраев, таймауты антифрода и деградация вместо падения кассы.\n\nНужно понять, хватит ли текущего лимита на эквайере, не упрёмся ли в синхронный вызов скоринга и что будет, если провайдер начнёт отдавать 429.\n\nВ оценку закладываем: нагрузку, наблюдаемость, рубильник и откат. Не закладываем редизайн админки и новые методы оплаты.",
};

function ago(ms: number): number {
  return now() - ms;
}

function bot(id: string, name: string, token: string): StoredPlayer {
  return { id, name, token, lastSeen: now(), bot: true, joinedAt: ago(50 * 60_000) };
}

export function buildDemoRoom(): StoredRoom {
  const players = DEMO_BOTS.map((b) => bot(b.id, b.name, b.token));
  const votes: Record<string, CardValue> = {};
  for (const b of DEMO_BOTS) votes[b.id] = b.vote;
  const roundId = "round-demo-black-friday";

  const history: HistoryEntry[] = [
    {
      id: "thist1",
      title: "Авторизация через SSO",
      description: "IdP, сессии, отзов токенов.",
      result: "l",
      votes: [
        { name: "Ольга", value: "m" },
        { name: "Максим", value: "xl" },
        { name: "Анна", value: "l" },
        { name: "Илья", value: "l" },
        { name: "Катя", value: "s" },
      ],
      ts: ago(38 * 60_000),
    },
    {
      id: "thist2",
      title: "Редизайн карточки заказа",
      description: "Новая вёрстка и состояния ошибок.",
      result: "m",
      votes: [
        { name: "Ольга", value: "s" },
        { name: "Максим", value: "m" },
        { name: "Анна", value: "m" },
        { name: "Илья", value: "s" },
        { name: "Катя", value: "m" },
      ],
      ts: ago(22 * 60_000),
    },
    {
      id: "thist3",
      title: "Уведомления в чат вместо почты",
      description: "Канал дежурства и треды по инцидентам.",
      result: "s",
      votes: [
        { name: "Ольга", value: "s" },
        { name: "Максим", value: "s" },
        { name: "Анна", value: "xs" },
        { name: "Илья", value: "s" },
        { name: "Катя", value: "s" },
      ],
      ts: ago(16 * 60_000),
    },
  ];

  const chat: ChatEntry[] = [
    {
      id: "cd01",
      kind: "system",
      text: "Ольга создал(а) комнату.",
      textEn: "Olga created the room.",
      ts: ago(48 * 60_000),
    },
    {
      id: "cd02",
      kind: "system",
      text: "Максим входит в группу.",
      textEn: "Maxim joins the party.",
      ts: ago(47 * 60_000),
    },
    {
      id: "cd03",
      kind: "system",
      text: "Анна входит в группу.",
      textEn: "Anna joins the party.",
      ts: ago(47 * 60_000 - 20_000),
    },
    {
      id: "cd04",
      kind: "system",
      text: "Илья входит в группу.",
      textEn: "Ilya joins the party.",
      ts: ago(46 * 60_000),
    },
    {
      id: "cd05",
      kind: "system",
      text: "Катя входит в группу.",
      textEn: "Katya joins the party.",
      ts: ago(46 * 60_000 - 15_000),
    },
    {
      id: "cd06",
      kind: "system",
      text: "Ведущий выставил задачу: Авторизация через SSO",
      textEn: "The host posted a task: Авторизация через SSO",
      ts: ago(45 * 60_000),
    },
    {
      id: "cd07",
      kind: "say",
      fromId: "botolga",
      from: "Ольга",
      text: "Без «это же просто кнопка». Там IdP, сессии и отзыв токенов.",
      ts: ago(44 * 60_000),
    },
    {
      id: "cd08",
      kind: "say",
      fromId: "botmax1",
      from: "Максим",
      text: "Ставлю больше: мобильные клиенты на старом refresh не переживут ротацию.",
      ts: ago(43 * 60_000),
    },
    {
      id: "cd09",
      kind: "say",
      fromId: "botanna",
      from: "Анна",
      text: "Если мобильные не трогаем в этом спринте — для меня это l.",
      ts: ago(42 * 60_000),
    },
    {
      id: "cd10",
      kind: "snow",
      fromId: "botmax1",
      from: "Максим",
      targetId: "botilya",
      target: "Илья",
      text: "Максим бросил снежок в Илья.",
      textEn: "Maxim threw a snowball at Ilya.",
      ts: ago(41 * 60_000),
    },
    {
      id: "cd11",
      kind: "say",
      fromId: "botilya",
      from: "Илья",
      text: "Эй! Я как раз писал про LDAP.",
      ts: ago(40 * 60_000),
    },
    {
      id: "cd12",
      kind: "system",
      text: "Задача «Авторизация через SSO» оценена как l.",
      textEn: "Task “Авторизация через SSO” estimated as l.",
      ts: ago(38 * 60_000),
    },
    {
      id: "cd13",
      kind: "system",
      text: "Ведущий выставил задачу: Редизайн карточки заказа",
      textEn: "The host posted a task: Редизайн карточки заказа",
      ts: ago(28 * 60_000),
    },
    {
      id: "cd14",
      kind: "say",
      fromId: "botkaty",
      from: "Катя",
      text: "Тут объём вёрстки и пустые состояния, не скрытый риск.",
      ts: ago(26 * 60_000),
    },
    {
      id: "cd15",
      kind: "system",
      text: "Задача «Редизайн карточки заказа» оценена как m.",
      textEn: "Task “Редизайн карточки заказа” estimated as m.",
      ts: ago(22 * 60_000),
    },
    {
      id: "cd16",
      kind: "system",
      text: "Ведущий выставил задачу: Нагрузка на платёжный шлюз при Black Friday",
      textEn: "The host posted a task: Нагрузка на платёжный шлюз при Black Friday",
      ts: ago(11 * 60_000),
    },
    {
      id: "cd17",
      kind: "say",
      fromId: "botolga",
      from: "Ольга",
      text: "Смотрим пик и деградацию, не «успеем / не успеем».",
      ts: ago(10 * 60_000),
    },
    {
      id: "cd18",
      kind: "say",
      fromId: "botanna",
      from: "Анна",
      text: "Кэш и очередь — это не XXL. У нас уже есть лимит на шлюзе.",
      ts: ago(8 * 60_000),
    },
    {
      id: "cd19",
      kind: "say",
      fromId: "botmax1",
      from: "Максим",
      text: "Если каскад на антифрод отвалится — касса встанет. Для меня XXL.",
      ts: ago(7 * 60_000),
    },
    {
      id: "cd20",
      kind: "system",
      text: "Сначала обсудите крайние оценки: Максим (XXL).",
      textEn: "Start with the farthest estimates: Maxim (XXL).",
      ts: ago(5 * 60_000),
    },
    {
      id: "cd21",
      kind: "say",
      fromId: "botkaty",
      from: "Катя",
      text: "Максим, давай с антифрода, не держи интригу.",
      ts: ago(4 * 60_000),
    },
    {
      id: "cd22",
      kind: "say",
      fromId: "botilya",
      from: "Илья",
      text: "Я на m, но уеду на l, если каскад правда синхронный.",
      ts: ago(2 * 60_000),
    },
  ];

  const room: StoredRoom = {
    code: DEMO_CODE,
    cardBackId: randomCardBackId(),
    hostId: "botolga",
    players,
    task: { ...DEMO_TASK },
    votes,
    roundId,
    variants: {},
    revealed: false,
    history,
    chat,
    snowUntil: {},
    demoHit: {},
  };
  for (const [playerId, value] of Object.entries(votes)) {
    room.variants[playerId] = selectVariantId(room, playerId, value);
  }
  return room;
}

/** Start every demo visit in an interactive round controlled by the visitor. */
export function prepareDemoJoin(room: StoredRoom, playerId: string): void {
  room.hostId = playerId;
  room.revealed = false;
  delete room.votes[playerId];
  delete room.variants[playerId];

  if (!room.task) {
    room.task = { ...DEMO_TASK };
    room.roundId = makeId("r");
    room.votes = {};
    room.variants = {};
  }

  for (const demoBot of DEMO_BOTS) {
    room.votes[demoBot.id] = demoBot.vote;
    room.variants[demoBot.id] = selectVariantId(room, demoBot.id, demoBot.vote);
  }
}

export function tickDemoRoom(room: StoredRoom): boolean {
  if (room.code !== DEMO_CODE) return false;
  let changed = false;
  const present = new Set(room.players.map((p) => p.id));
  for (const b of DEMO_BOTS) {
    if (present.has(b.id)) continue;
    room.players.push(bot(b.id, b.name, b.token));
    if (!room.votes[b.id]) {
      room.votes[b.id] = b.vote;
      room.variants[b.id] = selectVariantId(room, b.id, b.vote);
    }
    changed = true;
  }
  if (!room.players.some((p) => p.id === room.hostId)) {
    room.hostId = "botolga";
    changed = true;
  }
  room.demoHit ??= {};
  const maxim = room.players.find((p) => p.id === "botmax1");
  if (!maxim) return changed;
  const t = now();
  for (const p of room.players) {
    if (p.bot) continue;
    const start = p.joinedAt ?? p.lastSeen;
    if (t - start < DEMO_SNOW_AFTER_MS) continue;
    if (room.demoHit[p.id]) continue;
    room.demoHit[p.id] = true;
    throwSnowball(room, maxim, p);
    changed = true;
  }
  return changed;
}
