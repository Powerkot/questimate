import {
  Check,
  Copy,
  Crown,
  LogOut,
  MessageCircle,
  Presentation,
  ScrollText,
  Sparkles,
  Users,
  WifiOff,
} from "lucide-react";
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
import { type CardValue, type PublicPlayer, type Snapshot } from "@/lib/poker/types";
import { APP_NAME } from "@/lib/brand";
import { cn } from "@/lib/cn";

type Props = {
  roomCode?: string;
  onRoomCode: (code: string | undefined) => void;
};

type VoteStatus = "idle" | "saving" | "saved" | "failed";

export function Questimate({ roomCode, onRoomCode }: Props) {
  const [lang, setLang] = useState<Lang>("ru");
  const [name, setName] = useState("");
  const [codeInput, setCodeInput] = useState(roomCode ?? "");
  const [you, setYou] = useState<string | null>(null);
  const [state, setState] = useState<Snapshot | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [picked, setPicked] = useState<CardValue | null>(null);
  const [voteStatus, setVoteStatus] = useState<VoteStatus>("idle");
  const [resultPick, setResultPick] = useState<CardValue | null>(null);
  const [taskCollapsed, setTaskCollapsed] = useState(true);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [menu, setMenu] = useState<{ x: number; y: number; targetId: string } | null>(null);
  const [sideTab, setSideTab] = useState<"history" | "chat">("chat");
  const [presentation, setPresentation] = useState(false);
  const identity = useRef<{ playerId: string; token: string } | null>(null);
  const snowSeen = useRef(0);
  const codeRef = useRef<string | undefined>(undefined);
  const snapKey = useRef("");
  const actRef = useRef<
    (data: PokerActionInput, opts?: { keepPicked?: boolean; silent?: boolean }) => Promise<boolean>
  >(async () => false);
  const t = I18N[lang];
  codeRef.current = state?.code;

  useEffect(() => {
    identity.current = getOrCreateIdentity();
    setLang(loadLang());
    setName(loadName());
  }, []);

  useEffect(() => {
    if (!state && roomCode) setCodeInput(roomCode);
  }, [roomCode, state]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const applyResult = useCallback(
    (res: Awaited<ReturnType<typeof pokerActionFn>>, keepPicked = false, silent = false) => {
      if (!res.ok) {
        if (!silent) setError(res.error);
        if (res.error === "room_not_found") {
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
      if (!silent) setError(null);
      if (!keepPicked && (!res.state.task || res.state.revealed)) setPicked(null);
      if (!res.state.revealed) setResultPick(null);
      if (codeRef.current !== res.state.code) {
        onRoomCode(res.state.code);
        window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
      }
      return true;
    },
    [onRoomCode],
  );

  const act = useCallback(
    async (data: PokerActionInput, opts?: { keepPicked?: boolean; silent?: boolean }) => {
      try {
        const res = await pokerActionFn({ data });
        return applyResult(res, opts?.keepPicked, opts?.silent);
      } catch {
        if (!opts?.silent) setError("network");
        return false;
      }
    },
    [applyResult],
  );
  actRef.current = act;

  useEffect(() => {
    if (!you || !state?.code) return;
    let cancelled = false;
    let timer = 0;
    const loop = async () => {
      while (!cancelled) {
        const id = identity.current;
        const code = codeRef.current;
        if (!id || !code) break;
        await actRef.current(
          { type: "sync", code, playerId: id.playerId, token: id.token },
          { silent: true },
        );
        await new Promise((resolve) => {
          timer = window.setTimeout(resolve, document.hidden ? 6000 : 1500);
        });
      }
    };
    void loop();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [you, state?.code]);

  useEffect(() => {
    if (!state || !you) return;
    const until = state.players.find((p) => p.id === you)?.snowUntil ?? 0;
    if (until > snowSeen.current && until > Date.now()) {
      snowSeen.current = until;
      vibrateHit();
      playHit();
    }
  }, [state, you]);

  useEffect(() => {
    setPicked(null);
    setVoteStatus("idle");
  }, [state?.roundId]);

  const toggleLang = () => {
    const next = lang === "ru" ? "en" : "ru";
    setLang(next);
    saveLang(next);
  };

  const enter = async (mode: "create" | "join", forcedCode?: string) => {
    const nick = name.trim();
    if (!nick) {
      setError("name_required");
      return;
    }
    const id = identity.current ?? getOrCreateIdentity();
    identity.current = id;
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
        const code = (forcedCode ?? codeInput).trim().toUpperCase();
        setCodeInput(code);
        if (!/^[A-Z0-9]{5}$/.test(code)) {
          setError("invalid_code");
          return;
        }
        await act({ type: "join", code, name: nick, playerId: id.playerId, token: id.token });
      }
    } catch {
      setError("network");
    } finally {
      setBusy(false);
    }
  };

  const leaveRoom = async () => {
    const id = identity.current;
    if (id && state) {
      await act(
        { type: "leave", code: state.code, playerId: id.playerId, token: id.token },
        { silent: true },
      );
    }
    setState(null);
    setYou(null);
    setPicked(null);
    setPresentation(false);
    snapKey.current = "";
    onRoomCode(undefined);
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
        invitedCode={roomCode}
        busy={busy}
        error={error}
        onName={setName}
        onCode={setCodeInput}
        onCreate={() => void enter("create")}
        onJoin={() => void enter("join")}
        onDemo={() => void enter("join", DEMO_CODE)}
        onLang={toggleLang}
      />
    );
  }

  const votedCount = state.players.filter((player) => player.voted).length;
  const allVoted = state.players.length > 0 && votedCount === state.players.length;

  return (
    <div className={cn("quest-app", presentation && "is-presenting")}>
      <header className="quest-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            Q
          </span>
          <div>
            <strong>{APP_NAME}</strong>
            <span>{lang === "ru" ? "оценка как приключение" : "estimation as an adventure"}</span>
          </div>
        </div>
        <div className="room-tools">
          <button
            type="button"
            className="room-code"
            onClick={async () => {
              const url = `${location.origin}/?room=${state.code}`;
              try {
                await navigator.clipboard.writeText(url);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1600);
              } catch {
                setError("network");
              }
            }}
            aria-label={t.copy}
          >
            <span>{state.code}</span>
            {copied ? <Check /> : <Copy />}
          </button>
          <Button
            type="button"
            variant="tiny"
            size="tiny"
            aria-label={presentation ? t.exitPresentation : t.presentation}
            onClick={() => setPresentation((value) => !value)}
          >
            <Presentation className="size-4" />
            <span className="hide-phone">{presentation ? t.exitPresentation : t.presentation}</span>
          </Button>
          <Button type="button" variant="lang" size="tiny" onClick={toggleLang}>
            {lang === "ru" ? "EN" : "RU"}
          </Button>
          <Button
            type="button"
            variant="tiny"
            size="tiny"
            aria-label={t.leave}
            onClick={() => void leaveRoom()}
          >
            <LogOut className="size-4" />
            <span className="hide-phone">{t.leave}</span>
          </Button>
        </div>
      </header>

      {error ? (
        <div className="room-error" role="alert">
          <WifiOff className="size-4" /> {errorText(error, t)}
          <button type="button" onClick={() => setError(null)}>
            ×
          </button>
        </div>
      ) : null}

      <main className="quest-layout">
        <div className="quest-stage">
          <TaskCard
            t={t}
            task={state.task}
            collapsed={taskCollapsed}
            onToggle={() => setTaskCollapsed((value) => !value)}
          />

          {isHost && !state.task && !presentation ? (
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
          ) : !state.task ? (
            <div className="waiting-card">
              <Sparkles aria-hidden="true" />
              <p>{t.waitingForTask}</p>
            </div>
          ) : null}

          <section className="party-table" aria-labelledby="party-title">
            <div className="section-heading">
              <div>
                <span className="eyebrow">
                  <Users /> {t.team}
                </span>
                <h2 id="party-title">
                  {allVoted ? t.allVoted : t.votesOf(votedCount, state.players.length)}
                </h2>
              </div>
              <div className="vote-progress" aria-hidden="true">
                <span
                  style={{
                    width: `${state.players.length ? (votedCount / state.players.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div className={cn("seat-grid", state.revealed && "is-revealed")}>
              {state.players.map((player) => (
                <Seat
                  key={player.id}
                  player={player}
                  t={t}
                  lang={lang}
                  now={now}
                  task={Boolean(state.task)}
                  revealed={state.revealed}
                  outlier={Boolean(analysis?.outliers.some((item) => item.id === player.id))}
                  isYou={player.id === you}
                  backId={state.cardBackId}
                  onNameClick={(x, y) => setMenu({ x, y, targetId: player.id })}
                />
              ))}
            </div>
          </section>

          {analysis ? (
            <ConsensusPanel
              t={t}
              lang={lang}
              state={state}
              analysis={analysis}
              isHost={isHost}
              onAsk={() => {
                const id = identity.current;
                if (!id) return;
                void act({
                  type: "ask-outliers",
                  code: state.code,
                  playerId: id.playerId,
                  token: id.token,
                });
              }}
            />
          ) : null}

          {state.task && !state.revealed && !presentation ? (
            <section className="deck-panel" aria-labelledby="deck-title">
              <div className="section-heading deck-heading">
                <div>
                  <span className="eyebrow">
                    <Sparkles /> {t.chooseCard}
                  </span>
                  <h2 id="deck-title">{t.chooseCardHint}</h2>
                </div>
                <VoteState status={voteStatus} t={t} />
              </div>
              <Deck
                scale={state.scale}
                picked={picked ?? me?.vote ?? null}
                lang={lang}
                variants={state.deckVariants}
                backId={state.cardBackId}
                onPick={async (value) => {
                  const id = identity.current;
                  if (!id) return;
                  const previous = picked ?? me?.vote ?? null;
                  setPicked(value);
                  setVoteStatus("saving");
                  const ok = await act(
                    {
                      type: "vote",
                      code: state.code,
                      playerId: id.playerId,
                      token: id.token,
                      value,
                    },
                    { keepPicked: true },
                  );
                  if (ok) setVoteStatus("saved");
                  else {
                    setPicked(previous);
                    setVoteStatus("failed");
                  }
                }}
              />
            </section>
          ) : null}

          {isHost && state.task && !presentation ? (
            <HostControls
              t={t}
              state={state}
              resultPick={resultPick}
              onResultPick={setResultPick}
              onReveal={() => {
                const id = identity.current;
                if (!id) return;
                void act({
                  type: "reveal",
                  code: state.code,
                  playerId: id.playerId,
                  token: id.token,
                });
              }}
              onRevote={() => {
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
              onFinalize={() => {
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
            />
          ) : null}
        </div>

        {!presentation ? (
          <SidePanel
            t={t}
            lang={lang}
            tab={sideTab}
            onTab={setSideTab}
            you={you}
            history={state.history}
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
              if (targetId !== you) setMenu({ x, y, targetId });
            }}
          />
        ) : null}
      </main>

      <div className="sr-only" aria-live="polite">
        {voteStatus === "saved" ? t.voteSaved : voteStatus === "failed" ? t.voteFailed : ""}
      </div>

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

function errorText(error: string, t: (typeof I18N)[Lang]): string {
  if (error === "name_required") return t.nameRequired;
  if (error === "invalid_code") return t.invalidRoom;
  if (error === "room_not_found") return t.roomMissing;
  return t.actionFailed;
}

function Lobby({
  lang,
  t,
  name,
  codeInput,
  invitedCode,
  busy,
  error,
  onName,
  onCode,
  onCreate,
  onJoin,
  onDemo,
  onLang,
}: {
  lang: Lang;
  t: (typeof I18N)[Lang];
  name: string;
  codeInput: string;
  invitedCode?: string;
  busy: boolean;
  error: string | null;
  onName: (value: string) => void;
  onCode: (value: string) => void;
  onCreate: () => void;
  onJoin: () => void;
  onDemo: () => void;
  onLang: () => void;
}) {
  return (
    <main className="lobby-page">
      <div className="lobby-aurora" aria-hidden="true" />
      <header className="lobby-nav">
        <div className="brand-lockup">
          <span className="brand-mark">Q</span>
          <div>
            <strong>{APP_NAME}</strong>
            <span>Estimate together. Reveal together.</span>
          </div>
        </div>
        <Button type="button" variant="lang" onClick={onLang}>
          {lang === "ru" ? "EN" : "RU"}
        </Button>
      </header>

      <section className="lobby-grid">
        <div className="lobby-story">
          <span className="eyebrow">
            <Sparkles /> {lang === "ru" ? "PLANNING POKER ДЛЯ КОМАНД" : "PLANNING POKER FOR TEAMS"}
          </span>
          <h1>
            {lang === "ru"
              ? "Превратите оценку в короткое приключение"
              : "Turn every estimate into a short adventure"}
          </h1>
          <p>{t.lede}</p>
          <div className="lobby-points">
            <span>{lang === "ru" ? "Без регистрации" : "No sign-up"}</span>
            <span>{lang === "ru" ? "Скрытые голоса" : "Blind voting"}</span>
            <span>{lang === "ru" ? "Понятный следующий шаг" : "A clear next step"}</span>
          </div>
          <div className="card-fan" aria-hidden="true">
            <MagicCard value="s" face="front" size="hero" lang={lang} />
            <MagicCard
              value="m"
              variantId="m-sledopyt-vernyak"
              face="front"
              size="hero"
              lang={lang}
            />
            <MagicCard
              value="l"
              variantId="l-kapitan-skladny"
              face="front"
              size="hero"
              lang={lang}
            />
          </div>
        </div>

        <div className="lobby-card">
          {invitedCode ? <div className="invite-banner">{t.invited(invitedCode)}</div> : null}
          <div>
            <span className="eyebrow">
              {lang === "ru" ? "СОБЕРИТЕ ГРУППУ" : "GATHER YOUR PARTY"}
            </span>
            <h2>
              {lang === "ru" ? "Как вас представить команде?" : "How should the party know you?"}
            </h2>
          </div>
          <label className="field-label" htmlFor="name">
            {t.yourName}
          </label>
          <Input
            id="name"
            value={name}
            maxLength={24}
            autoComplete="nickname"
            autoFocus
            onChange={(event) => onName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") onCreate();
            }}
          />
          <Button type="button" className="w-full" disabled={busy} onClick={onCreate}>
            {busy ? t.connecting : t.create}
          </Button>
          <p className="form-hint">{t.createHint}</p>

          <div className="join-divider">
            <span>{lang === "ru" ? "или по приглашению" : "or with an invite"}</span>
          </div>
          <label className="field-label" htmlFor="code">
            {t.roomCode}
          </label>
          <div className="join-row">
            <Input
              id="code"
              value={codeInput}
              maxLength={5}
              inputMode="text"
              placeholder="ABC12"
              className="room-input"
              onChange={(event) =>
                onCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") onJoin();
              }}
            />
            <Button type="button" variant="ghost" disabled={busy} onClick={onJoin}>
              {t.join}
            </Button>
          </div>
          <p className="form-hint">{t.joinHint}</p>
          {error ? (
            <div className="lobby-error" role="alert">
              {errorText(error, t)}
            </div>
          ) : null}

          <div className="demo-invite">
            <div>
              <strong>{t.demoTitle}</strong>
              <span>{t.demoText}</span>
            </div>
            <Button type="button" variant="tiny" size="tiny" disabled={busy} onClick={onDemo}>
              {t.tryDemo}
            </Button>
          </div>
        </div>
      </section>
    </main>
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
  if (!task) return null;
  const long = task.description.length > 220 || task.description.split("\n").length > 3;
  const clamp = long && collapsed;
  return (
    <article className="quest-card task-card">
      <span className="eyebrow">{t.newTask}</span>
      <h1>{task.title}</h1>
      {task.description ? (
        <p className={cn("task-copy", clamp && "line-clamp-3")}>{task.description}</p>
      ) : null}
      {long ? (
        <button type="button" className="text-link" onClick={onToggle}>
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
    <section className="quest-card new-quest">
      <span className="eyebrow">
        <Sparkles /> {t.newTask}
      </span>
      <h1>{t.noTask}</h1>
      <Input
        value={title}
        maxLength={140}
        placeholder={t.taskTitlePh}
        onChange={(event) => setTitle(event.target.value)}
      />
      <Textarea
        value={description}
        maxLength={4000}
        rows={4}
        placeholder={t.taskDescPh}
        onChange={(event) => setDescription(event.target.value)}
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
    </section>
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
  isYou,
  backId,
  onNameClick,
}: {
  player: PublicPlayer;
  t: (typeof I18N)[Lang];
  lang: Lang;
  now: number;
  task: boolean;
  revealed: boolean;
  outlier: boolean;
  isYou: boolean;
  backId: string;
  onNameClick: (x: number, y: number) => void;
}) {
  const snow = player.snowUntil > now;
  let face: "back" | "front" | "empty" = "empty";
  if (task && player.voted && !revealed) face = "back";
  else if (revealed && player.vote) face = "front";
  return (
    <article className={cn("player-seat", isYou && "is-you", outlier && revealed && "is-outlier")}>
      <div className="player-meta">
        <button
          type="button"
          disabled={isYou}
          onClick={(event) => onNameClick(event.clientX, event.clientY)}
        >
          {player.name}
          {isYou ? (lang === "ru" ? " · вы" : " · you") : ""}
          {snow ? " ☃" : ""}
        </button>
        <span>
          {player.isHost ? (
            <>
              <Crown /> {t.host}
            </>
          ) : player.voted ? (
            t.voted
          ) : (
            t.waiting
          )}
        </span>
      </div>
      <MagicCard
        value={player.vote}
        variantId={player.variantId}
        backId={backId}
        face={face}
        size={revealed ? "hero" : "seat"}
        lang={lang}
        outlier={outlier && revealed}
      />
    </article>
  );
}

function Deck({
  scale,
  picked,
  lang,
  variants,
  backId,
  onPick,
}: {
  scale: readonly CardValue[];
  picked: CardValue | null;
  lang: Lang;
  variants: Record<CardValue, string>;
  backId: string;
  onPick: (value: CardValue) => void;
}) {
  return (
    <div className="deck-grid">
      {scale.map((value) => (
        <MagicCard
          key={value}
          value={value}
          variantId={variants[value]}
          backId={backId}
          face="front"
          size="deck"
          lang={lang}
          selected={picked === value}
          onClick={() => onPick(value)}
        />
      ))}
    </div>
  );
}

function VoteState({ status, t }: { status: VoteStatus; t: (typeof I18N)[Lang] }) {
  if (status === "idle") return null;
  return (
    <span className={cn("vote-state", status === "failed" && "is-error")}>
      {status === "saving" ? (
        <span className="status-dot" />
      ) : status === "saved" ? (
        <Check />
      ) : (
        <WifiOff />
      )}
      {status === "saving" ? t.voteSaving : status === "saved" ? t.voteSaved : t.voteFailed}
    </span>
  );
}

function ConsensusPanel({
  t,
  lang,
  state,
  analysis,
  isHost,
  onAsk,
}: {
  t: (typeof I18N)[Lang];
  lang: Lang;
  state: Snapshot;
  analysis: NonNullable<ReturnType<typeof analyzeVotes>>;
  isHost: boolean;
  onAsk: () => void;
}) {
  const levelLabel =
    analysis.level === "high"
      ? t.levelHigh
      : analysis.level === "medium"
        ? t.levelMedium
        : t.levelLow;
  const outlierValues = [...new Set(analysis.outliers.map((player) => player.vote))];
  const cardValues = state.players
    .filter((player) => player.vote)
    .map((player) => ({ value: player.vote as string, variantId: player.variantId }));
  const questionCount = analysis.specials.filter((player) => player.vote === "?").length;
  const coffeeCount = analysis.specials.filter((player) => player.vote === "☕").length;
  let insight = t.allAgree;
  if (!analysis.sized.length) insight = t.noSizedVotes;
  else if (analysis.far)
    insight = t.votedWhileMost(analysis.far.name, analysis.far.vote || "", analysis.mode);

  return (
    <section className="consensus-card">
      <div className="consensus-score">
        <div
          className={cn("score-ring", `is-${analysis.level}`)}
          style={{ "--score": `${analysis.consensusPct * 3.6}deg` } as React.CSSProperties}
        >
          <span>{analysis.consensusPct}%</span>
        </div>
        <div>
          <span className="eyebrow">{t.consensus}</span>
          <h2>{levelLabel}</h2>
          <p>{insight}</p>
        </div>
      </div>
      <MiniFaces values={cardValues} lang={lang} />
      <dl className="consensus-stats">
        <div>
          <dt>{t.median}</dt>
          <dd>{analysis.median}</dd>
        </div>
        <div>
          <dt>{t.mode}</dt>
          <dd>{analysis.mode}</dd>
        </div>
        <div>
          <dt>{t.range}</dt>
          <dd>{analysis.range}</dd>
        </div>
        <div>
          <dt>{t.outliers}</dt>
          <dd>{outlierValues.length ? outlierValues.join(", ") : t.none}</dd>
        </div>
      </dl>
      {questionCount || coffeeCount ? (
        <div className="special-signals">
          <strong>{t.specialVotes}</strong>
          {questionCount ? (
            <span>
              ? · {t.clearQuestion} ({questionCount})
            </span>
          ) : null}
          {coffeeCount ? (
            <span>
              ☕ · {t.breakRequested} ({coffeeCount})
            </span>
          ) : null}
        </div>
      ) : null}
      {isHost && analysis.askOrder.length ? (
        <Button type="button" onClick={onAsk}>
          {t.askOutliers}
        </Button>
      ) : null}
    </section>
  );
}

function HostControls({
  t,
  state,
  resultPick,
  onResultPick,
  onReveal,
  onRevote,
  onFinalize,
}: {
  t: (typeof I18N)[Lang];
  state: Snapshot;
  resultPick: CardValue | null;
  onResultPick: (value: CardValue) => void;
  onReveal: () => void;
  onRevote: () => void;
  onFinalize: () => void;
}) {
  return (
    <section className="host-controls">
      {!state.revealed ? (
        <>
          <div>
            <strong>{t.reveal}</strong>
            <span>{t.revealHint}</span>
          </div>
          <Button type="button" onClick={onReveal}>
            {t.reveal}
          </Button>
        </>
      ) : (
        <div className="finalize-panel">
          <div className="finalize-title">
            <div>
              <strong>{t.finalEstimate}</strong>
              <span>{t.pickResult}</span>
            </div>
            <Button type="button" variant="ghost" onClick={onRevote}>
              {t.revote}
            </Button>
          </div>
          <div className="result-grid">
            {state.scale.map((value) => (
              <button
                key={value}
                type="button"
                className={cn(resultPick === value && "is-selected")}
                onClick={() => onResultPick(value)}
              >
                {value}
              </button>
            ))}
          </div>
          <Button type="button" disabled={!resultPick} onClick={onFinalize}>
            {t.saveResult}
          </Button>
        </div>
      )}
    </section>
  );
}

function SidePanel({
  t,
  lang,
  tab,
  onTab,
  you,
  history,
  entries,
  onSay,
  onNick,
}: {
  t: (typeof I18N)[Lang];
  lang: Lang;
  tab: "history" | "chat";
  onTab: (tab: "history" | "chat") => void;
  you: string;
  history: Snapshot["history"];
  entries: Snapshot["chat"];
  onSay: (text: string) => void;
  onNick: (id: string, x: number, y: number) => void;
}) {
  return (
    <aside className="side-panel">
      <div className="side-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "chat"}
          onClick={() => onTab("chat")}
        >
          <MessageCircle /> {t.chat}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "history"}
          onClick={() => onTab("history")}
        >
          <ScrollText /> {t.history}
        </button>
      </div>
      {tab === "history" ? (
        <HistoryPanel t={t} history={history} />
      ) : (
        <ChatPanel t={t} lang={lang} you={you} entries={entries} onSay={onSay} onNick={onNick} />
      )}
    </aside>
  );
}

function HistoryPanel({ t, history }: { t: (typeof I18N)[Lang]; history: Snapshot["history"] }) {
  return (
    <div className="history-panel">
      {!history.length ? (
        <p className="empty-copy">{t.historyEmpty}</p>
      ) : (
        history.map((item) => (
          <article key={item.id} className="history-item">
            <div>
              <strong>{item.title}</strong>
              <span>{item.result}</span>
            </div>
            <p>{item.votes.map((vote) => `${vote.name}: ${vote.value}`).join(" · ")}</p>
          </article>
        ))
      )}
    </div>
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
    const element = logRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [entries, lang]);
  return (
    <div className="chat-panel">
      <div ref={logRef} className="chat-log">
        {entries.map((entry) => (
          <div key={entry.id} className={cn("chat-line", `is-${entry.kind}`)}>
            {entry.kind === "say" ? (
              <>
                <button
                  type="button"
                  className={entry.fromId === you ? "is-you" : ""}
                  onClick={(event) =>
                    entry.fromId && onNick(entry.fromId, event.clientX, event.clientY)
                  }
                >
                  {entry.from}
                </button>
                <span>{entry.text}</span>
              </>
            ) : (
              <span>{chatText(entry, lang)}</span>
            )}
          </div>
        ))}
      </div>
      <form
        className="chat-form"
        onSubmit={(event) => {
          event.preventDefault();
          const value = text.trim();
          if (!value) return;
          onSay(value);
          setText("");
        }}
      >
        <Input
          value={text}
          maxLength={400}
          autoComplete="off"
          placeholder={t.sayPh}
          onChange={(event) => setText(event.target.value)}
        />
        <Button type="submit" size="compact">
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
  const [position, setPosition] = useState({ left: x, top: y });
  useEffect(() => {
    setPosition({
      left: Math.min(x, window.innerWidth - 210),
      top: Math.min(y, window.innerHeight - 84),
    });
    const timer = window.setTimeout(() => window.addEventListener("click", onClose), 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("click", onClose);
    };
  }, [onClose, x, y]);
  return (
    <div className="context-menu" style={position} onClick={(event) => event.stopPropagation()}>
      <button type="button" onClick={onSnow}>
        ☃ {label}
      </button>
    </div>
  );
}
