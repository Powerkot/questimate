import { Copy, Crown, ScrollText } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MagicCard, MiniFaces } from "@/components/poker/MagicCard";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { createPokerRoomFn, pokerActionFn, type PokerActionInput } from "@/lib/poker/actions";
import { analyzeVotes } from "@/lib/poker/consensus";
import { DEMO_CODE } from "@/lib/poker/engine";
import { getOrCreateIdentity, loadLang, loadName, saveLang, saveName } from "@/lib/poker/identity";
import { I18N, chatText, type Lang } from "@/lib/poker/i18n";
import { playHit, vibrateHit } from "@/lib/poker/sound";
import { SIZE_RANK, type CardValue, type PublicPlayer, type Snapshot } from "@/lib/poker/types";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

type Props = {
  roomCode?: string;
  onRoomCode: (code: string | undefined) => void;
};

export function Questimate({ roomCode, onRoomCode }: Props) {
  const [lang, setLang] = useState<Lang>("ru");
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState(roomCode ?? "");
  const [you, setYou] = useState<string | null>(null);
  const [state, setState] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<CardValue | null>(null);
  const [resultPick, setResultPick] = useState<CardValue | null>(null);
  const [taskCollapsed, setTaskCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [menu, setMenu] = useState<{ x: number; y: number; targetId: string } | null>(null);
  const identity = useRef<{ playerId: string; token: string } | null>(null);
  const snowSeen = useRef(0);
  const codeRef = useRef<string | undefined>(undefined);
  const booted = useRef(false);
  const snapKey = useRef("");
  const actRef = useRef<(data: PokerActionInput, opts?: { keepPicked?: boolean }) => Promise<boolean>>(
    async () => false,
  );
  const t = I18N[lang];
  codeRef.current = state?.code;

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const applyResult = useCallback(
    (res: Awaited<ReturnType<typeof pokerActionFn>>, keepPicked = false) => {
      if (!res.ok) {
        if (res.error === "room_not_found") {
          setError("room_not_found");
          setState(null);
          setYou(null);
          onRoomCode(undefined);
        }
        return false;
      }
      setYou(res.you);
      const key = JSON.stringify(res.state);
      if (key !== snapKey.current) {
        snapKey.current = key;
        setState(res.state);
      }
      setError(null);
      if (!keepPicked && (!res.state.task || res.state.revealed)) setPicked(null);
      if (!res.state.revealed) setResultPick(null);
      if (codeRef.current !== res.state.code) onRoomCode(res.state.code);
      return true;
    },
    [onRoomCode],
  );

  const act = useCallback(
    async (data: PokerActionInput, opts?: { keepPicked?: boolean }) => {
      try {
        const res = await pokerActionFn({ data });
        return applyResult(res, opts?.keepPicked);
      } catch {
        return false;
      }
    },
    [applyResult],
  );
  actRef.current = act;

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;
    const id = getOrCreateIdentity();
    identity.current = id;
    const stored = loadName();
    setLang(loadLang());
    const nick = stored.trim() || "Вадим";
    setName(nick);
    if (!stored) saveName(nick);
    const code = roomCode && /^[A-Z0-9]{5}$/.test(roomCode) ? roomCode : DEMO_CODE;
    setBusy(true);
    void (async () => {
      try {
        await act({
          type: "join",
          code,
          name: nick,
          playerId: id.playerId,
          token: id.token,
        });
      } catch {
        setError("room_not_found");
      } finally {
        setBusy(false);
      }
    })();
  }, [act, roomCode]);

  useEffect(() => {
    if (!state || !you) return;
    const me = state.players.find((p) => p.id === you);
    const until = me?.snowUntil ?? 0;
    if (until > snowSeen.current && until > Date.now()) {
      snowSeen.current = until;
      vibrateHit();
      playHit();
    }
  }, [state, you]);

  useEffect(() => {
    if (!you) return;
    const id = identity.current;
    const code = codeRef.current;
    if (!id || !code) return;
    let cancelled = false;
    let timer = 0;
    const loop = async () => {
      while (!cancelled) {
        const liveId = identity.current;
        const liveCode = codeRef.current;
        if (!liveId || !liveCode) break;
        await actRef.current({
          type: "sync",
          code: liveCode,
          playerId: liveId.playerId,
          token: liveId.token,
        });
        await new Promise((r) => {
          timer = window.setTimeout(r, document.hidden ? 1800 : 500);
        });
      }
    };
    void loop();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [you, state?.code]);

  const toggleLang = () => {
    const next = lang === "ru" ? "en" : "ru";
    setLang(next);
    saveLang(next);
  };

  const enter = async (mode: "create" | "join") => {
    const id = identity.current ?? getOrCreateIdentity();
    identity.current = id;
    const nick = name.trim() || (mode === "create" ? "Host" : "Player");
    saveName(nick);
    setBusy(true);
    setError(null);
    try {
      if (mode === "create") {
        const res = await createPokerRoomFn({
          data: { name: nick, playerId: id.playerId, token: id.token },
        });
        applyResult(res);
      } else {
        const code = codeInput.trim().toUpperCase();
        if (!/^[A-Z0-9]{5}$/.test(code)) {
          setError("room_not_found");
          setBusy(false);
          return;
        }
        await act({
          type: "join",
          code,
          name: nick,
          playerId: id.playerId,
          token: id.token,
        });
      }
    } catch {
      setError("room_not_found");
    }
    setBusy(false);
  };

  const me = state?.players.find((p) => p.id === you);
  const isHost = Boolean(me?.isHost);
  const analysis = useMemo(
    () => (state ? analyzeVotes(state.players, state.revealed) : null),
    [state],
  );

  if (!state || !you) {
    return (
      <Lobby
        lang={lang}
        t={t}
        name={name}
        codeInput={codeInput}
        busy={busy}
        error={error}
        onName={setName}
        onCode={setCodeInput}
        onCreate={() => void enter("create")}
        onJoin={() => void enter("join")}
        onLang={toggleLang}
      />
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-2.5">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
          <strong className="font-display tracking-[0.12em]">{APP_NAME}</strong>
          <span className="font-display tracking-[0.16em] text-gold">{state.code}</span>
          <Button
            type="button"
            variant="tiny"
            size="tiny"
            onClick={async () => {
              const url = `${location.origin}/?room=${state.code}`;
              try {
                await navigator.clipboard.writeText(url);
              } catch {
                /* ignore */
              }
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
          >
            <Copy className="size-3.5" />
            {copied ? t.copied : t.copy}
          </Button>
          <span className="text-xs text-muted">
            {t.votesOf(state.votesCount, state.players.length)}
          </span>
        </div>
        <Button type="button" variant="lang" size="tiny" onClick={toggleLang}>
          {lang === "ru" ? "EN" : "RU"}
        </Button>
      </header>

      <main className="room-grid grid min-h-0 flex-1">
        <section className="flex flex-col gap-3.5 p-4">
          <TaskCard
            t={t}
            task={state.task}
            collapsed={taskCollapsed}
            onToggle={() => setTaskCollapsed((v) => !v)}
          />

          {isHost && !state.task ? (
            <HostTaskForm
              t={t}
              onPost={(title, description) => {
                const id = identity.current;
                if (!id) return;
                void act({
                  type: "set-task",
                  code: state.code,
                  playerId: id.playerId,
                  token: id.token,
                  title,
                  description,
                });
                setTaskCollapsed(true);
              }}
            />
          ) : null}

          <div className="table-felt rounded-xl p-4">
            <div className="flex flex-wrap justify-center gap-2.5">
              {state.players.map((p) => (
                <Seat
                  key={p.id}
                  player={p}
                  t={t}
                  lang={lang}
                  now={now}
                  task={Boolean(state.task)}
                  revealed={state.revealed}
                  outlier={Boolean(analysis?.outliers.some((o) => o.id === p.id))}
                  onNameClick={(x, y) => {
                    if (p.id === you) return;
                    setMenu({ x, y, targetId: p.id });
                  }}
                />
              ))}
            </div>
          </div>

          {analysis ? (
            <ConsensusPanel
              t={t}
              lang={lang}
              analysis={analysis}
              onAsk={() => {
                const id = identity.current;
                if (!id) return;
                void act({
                  type: "ask-outliers",
                  code: state.code,
                  playerId: id.playerId,
                  token: id.token,
                  order: analysis.askOrder.map((p) => ({
                    id: p.id,
                    name: p.name,
                    vote: p.vote || "",
                  })),
                });
              }}
            />
          ) : null}

          <Deck
            scale={state.scale}
            picked={picked ?? me?.vote ?? null}
            disabled={!state.task || state.revealed}
            lang={lang}
            onPick={(value) => {
              const id = identity.current;
              if (!id) return;
              setPicked(value);
              void act(
                {
                  type: "vote",
                  code: state.code,
                  playerId: id.playerId,
                  token: id.token,
                  value,
                },
                { keepPicked: true },
              );
            }}
          />

          {isHost && state.task ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                disabled={state.revealed}
                onClick={() => {
                  const id = identity.current;
                  if (!id) return;
                  void act({
                    type: "reveal",
                    code: state.code,
                    playerId: id.playerId,
                    token: id.token,
                  });
                }}
              >
                {t.reveal}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  const id = identity.current;
                  if (!id) return;
                  setPicked(null);
                  void act({
                    type: "revote",
                    code: state.code,
                    playerId: id.playerId,
                    token: id.token,
                  });
                }}
              >
                {t.revote}
              </Button>
              {state.revealed ? (
                <div className="flex w-full flex-wrap items-center gap-2">
                  <span className="text-sm text-muted">{t.resultLabel}:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {state.scale.map((v) => (
                      <MagicCard
                        key={v}
                        value={v}
                        face="front"
                        size="mini"
                        lang={lang}
                        selected={resultPick === v}
                        onClick={() => setResultPick(v)}
                      />
                    ))}
                  </div>
                  <Button
                    type="button"
                    disabled={!resultPick}
                    title={!resultPick ? t.pickResult : undefined}
                    onClick={() => {
                      const id = identity.current;
                      if (!id || !resultPick) return;
                      void act({
                        type: "finalize",
                        code: state.code,
                        playerId: id.playerId,
                        token: id.token,
                        result: resultPick,
                      });
                      setResultPick(null);
                    }}
                  >
                    {t.saveResult}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="flex min-h-0 flex-col border-t border-line lg:border-t-0 lg:border-l">
          <div className="max-h-[34%] overflow-auto border-b border-line p-3">
            <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-[0.08em] text-gold uppercase">
              <ScrollText className="size-3.5" />
              {t.history}
            </h3>
            <ul className="space-y-2 text-sm">
              {(state.history || []).length === 0 ? (
                <li className="text-muted">{t.historyEmpty}</li>
              ) : (
                state.history.map((h) => (
                  <li key={h.id} className="border-b border-line/80 pb-2">
                    <div>
                      <strong>{h.title}</strong>
                      {" → "}
                      <span className="font-bold text-gold-2">{h.result}</span>
                    </div>
                    <div className="text-xs text-muted">
                      {(h.votes || []).map((v) => `${v.name}: ${v.value}`).join(" · ")}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <ChatPanel
            t={t}
            lang={lang}
            you={you}
            entries={state.chat}
            onSay={(text) => {
              const id = identity.current;
              if (!id) return;
              void act({
                type: "chat",
                code: state.code,
                playerId: id.playerId,
                token: id.token,
                text,
              });
            }}
            onNick={(targetId, x, y) => {
              if (targetId === you) return;
              setMenu({ x, y, targetId });
            }}
          />
        </aside>
      </main>

      {menu ? (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          label={t.snow}
          onSnow={() => {
            const id = identity.current;
            if (!id) return;
            void act({
              type: "snowball",
              code: state.code,
              playerId: id.playerId,
              token: id.token,
              targetId: menu.targetId,
            });
            setMenu(null);
          }}
          onClose={() => setMenu(null)}
        />
      ) : null}
    </div>
  );
}

function Lobby({
  lang,
  t,
  name,
  codeInput,
  busy,
  error,
  onName,
  onCode,
  onCreate,
  onJoin,
  onLang,
}: {
  lang: Lang;
  t: (typeof I18N)[Lang];
  name: string;
  codeInput: string;
  busy: boolean;
  error: string | null;
  onName: (v: string) => void;
  onCode: (v: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  onLang: () => void;
}) {
  return (
    <div className="relative flex min-h-dvh items-start justify-center bg-bg px-4 pt-[12vh] text-fg">
      <div className="lobby-glow" />
      <div className="relative w-full max-w-[440px] rounded-xl border border-border bg-surface p-7 shadow-[0_20px_60px_#000a]">
        <p className="m-0 text-[11px] tracking-[0.18em] text-gold uppercase">{t.kicker}</p>
        <h1 className="mt-1 mb-2 font-display text-3xl tracking-[0.12em] text-balance">{APP_NAME}</h1>
        <p className="text-muted text-pretty leading-normal">{t.lede}</p>
        <label className="mt-5 mb-3 flex flex-col gap-1.5 text-sm text-muted">
          {t.yourName}
          <Input
            id="name"
            value={name}
            maxLength={24}
            autoComplete="nickname"
            onChange={(e) => onName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onCreate();
            }}
          />
        </label>
        <Button type="button" id="createBtn" className="mb-3 w-full" disabled={busy} onClick={onCreate}>
          {busy ? t.connecting : t.create}
        </Button>
        <div className="flex gap-2">
          <Input
            id="code"
            value={codeInput}
            maxLength={8}
            placeholder="ABC12"
            className="text-center tracking-[0.2em] uppercase"
            onChange={(e) => onCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => {
              if (e.key === "Enter") onJoin();
            }}
          />
          <Button type="button" id="joinBtn" variant="ghost" disabled={busy} onClick={onJoin}>
            {t.join}
          </Button>
        </div>
        {error ? <p className="mt-3 text-sm text-outlier">{t.roomMissing}</p> : null}
        <Button type="button" variant="lang" className="mt-4" onClick={onLang}>
          {lang === "ru" ? "EN" : "RU"}
        </Button>
      </div>
    </div>
  );
}

function TaskCard({
  t,
  task,
  collapsed,
  onToggle,
}: {
  t: (typeof I18N)[Lang];
  task: Snapshot["task"];
  collapsed: boolean;
  onToggle: () => void;
}) {
  if (!task) {
    return (
      <article className="rounded-lg border border-border bg-surface px-4 py-4 text-muted">
        <p>{t.noTask}</p>
      </article>
    );
  }
  const long = (task.description || "").length > 220 || (task.description || "").split("\n").length > 3;
  const clamp = long && collapsed;
  return (
    <article className="rounded-lg border border-border bg-surface px-[18px] py-4">
      <h2 className="mt-0 mb-2 font-display text-xl text-balance">{task.title}</h2>
      {task.description ? (
        <p
          className={cn(
            "whitespace-pre-wrap text-pretty leading-normal text-parchment",
            clamp && "line-clamp-3",
          )}
        >
          {task.description}
        </p>
      ) : null}
      {long ? (
        <button type="button" className="mt-2 text-sm text-gold" onClick={onToggle}>
          {clamp ? t.expand : t.collapse}
        </button>
      ) : null}
    </article>
  );
}

function HostTaskForm({
  t,
  onPost,
}: {
  t: (typeof I18N)[Lang];
  onPost: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-dashed border-line bg-surface p-3">
      <h3 className="m-0 text-xs font-semibold tracking-[0.08em] text-gold uppercase">{t.newTask}</h3>
      <Input
        id="taskTitle"
        value={title}
        maxLength={140}
        placeholder={t.taskTitlePh}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Textarea
        id="taskDesc"
        value={description}
        rows={4}
        placeholder={t.taskDescPh}
        onChange={(e) => setDescription(e.target.value)}
      />
      <Button
        type="button"
        disabled={!title.trim()}
        onClick={() => {
          onPost(title, description);
          setTitle("");
          setDescription("");
        }}
      >
        {t.postTask}
      </Button>
    </div>
  );
}

function Seat({
  player,
  t,
  lang,
  now,
  task,
  revealed,
  outlier,
  onNameClick,
}: {
  player: PublicPlayer;
  t: (typeof I18N)[Lang];
  lang: Lang;
  now: number;
  task: boolean;
  revealed: boolean;
  outlier: boolean;
  onNameClick: (x: number, y: number) => void;
}) {
  const snow = player.snowUntil > now;
  let face: "back" | "front" | "empty" = "empty";
  if (task && player.voted && !revealed) face = "back";
  else if (revealed && player.vote) face = "front";
  return (
    <div className="flex w-28 flex-col items-center gap-1.5 text-center">
      <button
        type="button"
        className="w-full font-semibold hover:text-gold-2"
        onClick={(e) => {
          e.stopPropagation();
          onNameClick(e.clientX, e.clientY);
        }}
      >
        {player.name}
        {snow ? <span className="ml-1">☃</span> : null}
      </button>
      <div className="flex items-center justify-center gap-1 text-[11px] text-gold">
        {player.isHost ? <Crown className="size-3" /> : null}
        {player.isHost ? t.host : null}
        {player.isHost ? " · " : null}
        {player.voted ? t.voted : t.waiting}
      </div>
      <MagicCard
        value={player.vote}
        face={face}
        size="seat"
        lang={lang}
        outlier={outlier && revealed}
      />
    </div>
  );
}

function Deck({
  scale,
  picked,
  disabled,
  lang,
  onPick,
}: {
  scale: readonly CardValue[];
  picked: CardValue | null;
  disabled: boolean;
  lang: Lang;
  onPick: (v: CardValue) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {scale.map((v) => (
        <MagicCard
          key={v}
          value={v}
          face="front"
          size="deck"
          lang={lang}
          selected={picked === v}
          disabled={disabled}
          onClick={() => onPick(v)}
        />
      ))}
    </div>
  );
}

function ConsensusPanel({
  t,
  lang,
  analysis,
  onAsk,
}: {
  t: (typeof I18N)[Lang];
  lang: Lang;
  analysis: NonNullable<ReturnType<typeof analyzeVotes>>;
  onAsk: () => void;
}) {
  const levelLabel =
    analysis.level === "high" ? t.levelHigh : analysis.level === "medium" ? t.levelMedium : t.levelLow;
  const outlierVals = [...new Set(analysis.outliers.map((p) => p.vote))];
  let insight: string;
  if (!analysis.sized.length && analysis.values.every((v) => !SIZE_RANK[v])) {
    insight = t.noSizedVotes;
  } else if (!analysis.outliers.length) insight = t.allAgree;
  else insight = t.votedWhileMost(analysis.far?.name || "", analysis.far?.vote || "", analysis.mode);

  return (
    <section className="rounded-lg border border-border bg-surface px-4 py-3.5">
      <div className="mb-3 flex flex-wrap items-baseline gap-3">
        <span className="font-display text-xl text-gold-2">
          {t.consensus}: {analysis.consensusPct}%
        </span>
      </div>
      <MiniFaces values={analysis.values} lang={lang} />
      <div className="mt-3 grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-x-4 gap-y-1.5 text-sm text-muted">
        <div>
          {t.median}: <b className="font-semibold text-fg">{analysis.median}</b>
        </div>
        <div>
          {t.mode}: <b className="font-semibold text-fg">{analysis.mode}</b>
        </div>
        <div>
          {t.range}: <b className="font-semibold text-fg">{analysis.range}</b>
        </div>
        <div>
          {t.outliers}:{" "}
          <b className="font-semibold text-fg">{outlierVals.length ? outlierVals.join(", ") : t.none}</b>
        </div>
        <div>
          {t.consensusLevel}: <b className="font-semibold text-fg">{levelLabel}</b>
        </div>
      </div>
      <p className="my-2 leading-normal text-parchment">{insight}</p>
      {analysis.askOrder.length ? (
        <Button type="button" className="mt-1.5 w-auto" onClick={onAsk}>
          {t.askOutliers}
        </Button>
      ) : null}
    </section>
  );
}

function ChatPanel({
  t,
  lang,
  you,
  entries,
  onSay,
  onNick,
}: {
  t: (typeof I18N)[Lang];
  lang: Lang;
  you: string;
  entries: Snapshot["chat"];
  onSay: (text: string) => void;
  onNick: (id: string, x: number, y: number) => void;
}) {
  const [text, setText] = useState("");
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    if (nearBottom) el.scrollTop = el.scrollHeight;
  }, [entries, lang]);

  return (
    <div className="flex min-h-[240px] flex-1 flex-col">
      <div
        ref={logRef}
        className="min-h-[180px] flex-1 overflow-auto bg-chat px-3 py-2.5 font-sans text-sm leading-[1.45]"
      >
        {entries.map((entry) => {
          if (entry.kind === "snow") {
            return (
              <div key={entry.id} className="my-0.5 text-snow">
                {chatText(entry, lang)}
              </div>
            );
          }
          if (entry.kind === "system") {
            return (
              <div key={entry.id} className="my-0.5 text-sys">
                {chatText(entry, lang)}
              </div>
            );
          }
          return (
            <div key={entry.id} className="my-0.5">
              <button
                type="button"
                className={cn("font-bold", entry.fromId === you ? "text-you" : "text-say")}
                onClick={(e) => {
                  e.stopPropagation();
                  if (entry.fromId) onNick(entry.fromId, e.clientX, e.clientY);
                }}
              >
                [{entry.from}]
              </button>
              {`: ${entry.text}`}
            </div>
          );
        })}
      </div>
      <form
        className="flex gap-1.5 bg-surface p-2"
        onSubmit={(e) => {
          e.preventDefault();
          const value = text.trim();
          if (!value) return;
          onSay(value);
          setText("");
        }}
      >
        <Input
          id="chatInput"
          value={text}
          maxLength={400}
          autoComplete="off"
          placeholder={t.sayPh}
          onChange={(e) => setText(e.target.value)}
        />
        <Button type="submit" variant="ghost" size="compact">
          {t.send}
        </Button>
      </form>
    </div>
  );
}

function ContextMenu({
  x,
  y,
  label,
  onSnow,
  onClose,
}: {
  x: number;
  y: number;
  label: string;
  onSnow: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const t = window.setTimeout(() => window.addEventListener("click", onClose), 0);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener("click", onClose);
    };
  }, [onClose]);
  return (
    <div
      className="fixed z-20 min-w-[180px] rounded-sm border border-gold/40 bg-menu p-1 shadow-[0_8px_24px_#000c]"
      style={{ left: Math.min(x, window.innerWidth - 200), top: Math.min(y, window.innerHeight - 80) }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className="block w-full rounded-sm px-2.5 py-2 text-left text-gold-2 hover:bg-gold/15"
        onClick={onSnow}
      >
        {label}
      </button>
    </div>
  );
}
