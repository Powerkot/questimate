import {
  Check,
  CircleHelp,
  Copy,
  Crown,
  LockKeyhole,
  LayoutGrid,
  LogOut,
  MessageCircle,
  Minimize2,
  Play,
  Presentation,
  ScrollText,
  Sparkles,
  Table2,
  Users,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MagicCard, MiniFaces } from "@/components/poker/MagicCard";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { createPokerRoomFn, pokerActionFn, type PokerActionInput } from "@/lib/poker/actions";
import { cardFaceLabel, cardLore } from "@/lib/poker/cards";
import { analyzeVotes, buildVoteShowcase, type ShowcaseVote } from "@/lib/poker/consensus";
import { DEMO_CODE } from "@/lib/poker/engine";
import {
  clearLastRoom,
  getOrCreateIdentity,
  loadLang,
  loadLastRoom,
  loadName,
  loadRoomView,
  saveLang,
  saveLastRoom,
  saveName,
  saveRoomView,
  type RoomViewMode,
} from "@/lib/poker/identity";
import { I18N, chatText, type Lang } from "@/lib/poker/i18n";
import { playHit, vibrateHit } from "@/lib/poker/sound";
import { canUseTable, tableSeatAssignments } from "@/lib/poker/table-layout";
import {
  type CardValue,
  type HistoryEntry,
  type PublicPlayer,
  type Snapshot,
} from "@/lib/poker/types";
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
  const [createPassword, setCreatePassword] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
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
  const [mobilePane, setMobilePane] = useState<"table" | "chat" | "history">("table");
  const [roomView, setRoomView] = useState<RoomViewMode>("table");
  const [presentation, setPresentation] = useState(false);
  const [resumeCode, setResumeCode] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [finalReveal, setFinalReveal] = useState<HistoryEntry | null>(null);
  const [voteShowcaseOpen, setVoteShowcaseOpen] = useState(false);
  const identity = useRef<{ playerId: string; token: string } | null>(null);
  const restoreAttempted = useRef(false);
  const snowSeen = useRef(0);
  const codeRef = useRef<string | undefined>(undefined);
  const snapKey = useRef("");
  const historyRoom = useRef<string | null>(null);
  const latestHistoryKey = useRef<string | null>(null);
  const finalRevealTimer = useRef<number | null>(null);
  const showcasedRound = useRef<string | null>(null);
  const actRef = useRef<
    (data: PokerActionInput, opts?: { keepPicked?: boolean; silent?: boolean }) => Promise<boolean>
  >(async () => false);
  const t = I18N[lang];
  codeRef.current = state?.code;
  const closeVoteShowcase = useCallback(() => setVoteShowcaseOpen(false), []);

  useEffect(() => {
    if (state) {
      setRestoring(false);
      return;
    }
    identity.current = getOrCreateIdentity();
    setLang(loadLang());
    setName(loadName());
    const savedRoom = loadLastRoom();
    if (savedRoom && (!roomCode || roomCode === savedRoom)) setResumeCode(savedRoom);
    else setRestoring(false);
  }, [roomCode, state]);

  useEffect(() => {
    if (!state && roomCode) setCodeInput(roomCode);
  }, [roomCode, state]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    setRoomView(loadRoomView());
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const applyResult = useCallback(
    (res: Awaited<ReturnType<typeof pokerActionFn>>, keepPicked = false, silent = false) => {
      if (!res.ok) {
        if (!silent) setError(res.error);
        if (res.error === "room_not_found") {
          clearLastRoom(codeRef.current ?? roomCode);
          setState(null);
          setYou(null);
          onRoomCode(undefined);
        }
        return false;
      }
      setYou(res.you);
      saveLastRoom(res.state.code);
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
    [onRoomCode, roomCode],
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
    if (!resumeCode || restoreAttempted.current) return;
    restoreAttempted.current = true;
    const id = identity.current;
    if (!id) {
      setRestoring(false);
      return;
    }
    const restore = async () => {
      try {
        const res = await pokerActionFn({
          data: { type: "resume", code: resumeCode, playerId: id.playerId, token: id.token },
        });
        if (res.ok) applyResult(res, true, true);
        else {
          if (res.error === "room_not_found" || res.error === "unauthorized") {
            clearLastRoom(resumeCode);
            if (roomCode === resumeCode) onRoomCode(undefined);
          }
        }
      } catch {
        setError("network");
      } finally {
        setRestoring(false);
        setResumeCode(null);
      }
    };
    void restore();
  }, [applyResult, onRoomCode, resumeCode, roomCode]);

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
    if (!you || !state?.code) return;
    const syncNow = () => {
      if (document.hidden) return;
      const id = identity.current;
      const code = codeRef.current;
      if (!id || !code) return;
      void actRef.current(
        { type: "sync", code, playerId: id.playerId, token: id.token },
        { silent: true },
      );
    };
    document.addEventListener("visibilitychange", syncNow);
    window.addEventListener("online", syncNow);
    window.addEventListener("pageshow", syncNow);
    return () => {
      document.removeEventListener("visibilitychange", syncNow);
      window.removeEventListener("online", syncNow);
      window.removeEventListener("pageshow", syncNow);
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

  useEffect(() => {
    const room = state?.code ?? null;
    const latest = state?.history[0] ?? null;
    const latestKey = latest ? `${latest.id}:${latest.ts}` : null;
    if (!room) {
      historyRoom.current = null;
      latestHistoryKey.current = null;
      setFinalReveal(null);
      return;
    }
    if (historyRoom.current !== room) {
      historyRoom.current = room;
      latestHistoryKey.current = latestKey;
      setFinalReveal(null);
      return;
    }
    if (latest && latestKey !== latestHistoryKey.current) {
      setFinalReveal(latest);
      if (finalRevealTimer.current) window.clearTimeout(finalRevealTimer.current);
      finalRevealTimer.current = window.setTimeout(() => setFinalReveal(null), 7000);
    }
    latestHistoryKey.current = latestKey;
  }, [state?.code, state?.history]);

  useEffect(
    () => () => {
      if (finalRevealTimer.current) window.clearTimeout(finalRevealTimer.current);
    },
    [],
  );

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
    const rawPassword = mode === "create" ? createPassword : forcedCode ? "" : joinPassword;
    const password = rawPassword.trim() ? rawPassword : undefined;
    if (password && password.length < 4) {
      setError("password_too_short");
      return;
    }
    identity.current = id;
    saveName(nick);
    setBusy(true);
    setError(null);
    try {
      if (mode === "create") {
        const res = await createPokerRoomFn({
          data: { name: nick, playerId: id.playerId, token: id.token, password },
        });
        if (applyResult(res)) setCreatePassword("");
      } else {
        const code = (forcedCode ?? codeInput).trim().toUpperCase();
        setCodeInput(code);
        if (!/^[A-Z0-9]{5}$/.test(code)) {
          setError("invalid_code");
          return;
        }
        const joined = await act({
          type: "join",
          code,
          name: nick,
          playerId: id.playerId,
          token: id.token,
          password,
        });
        if (joined) setJoinPassword("");
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
    if (state) clearLastRoom(state.code);
    setState(null);
    setYou(null);
    setPicked(null);
    setPresentation(false);
    setMobilePane("table");
    snapKey.current = "";
    onRoomCode(undefined);
  };

  const me = state?.players.find((p) => p.id === you);
  const isHost = Boolean(me?.isHost);
  const analysis = useMemo(
    () => (state ? analyzeVotes(state.players, state.revealed) : null),
    [state],
  );

  useEffect(() => {
    if (!state?.revealed || !analysis) {
      showcasedRound.current = null;
      setVoteShowcaseOpen(false);
      return;
    }
    if (showcasedRound.current === state.roundId) return;
    showcasedRound.current = state.roundId;
    setVoteShowcaseOpen(true);
  }, [analysis, state?.revealed, state?.roundId]);

  if (restoring) {
    return (
      <main className="restore-screen" aria-live="polite">
        <BrandLockup />
        <p>{t.connecting}</p>
      </main>
    );
  }

  if (!state || !you) {
    return (
      <Lobby
        lang={lang}
        t={t}
        name={name}
        codeInput={codeInput}
        createPassword={createPassword}
        joinPassword={joinPassword}
        invitedCode={roomCode}
        busy={busy}
        error={error}
        onName={setName}
        onCode={setCodeInput}
        onCreatePassword={setCreatePassword}
        onJoinPassword={setJoinPassword}
        onClearError={() => setError(null)}
        onCreate={() => void enter("create")}
        onJoin={() => void enter("join")}
        onDemo={() => void enter("join", DEMO_CODE)}
        onLang={toggleLang}
      />
    );
  }

  const votedCount = state.players.filter((player) => player.voted).length;
  const allVoted = state.players.length > 0 && votedCount === state.players.length;
  const tableEnabled = canUseTable(state.players.length);
  const visualMode: RoomViewMode = roomView === "table" && tableEnabled ? "table" : "cards";
  const playersById = new Map(state.players.map((player) => [player.id, player]));
  const tablePlayers = tableSeatAssignments(
    state.players.map((player) => player.id),
    you,
  ).flatMap(({ playerId, slot }) => {
    const player = playersById.get(playerId);
    return player ? [{ player, slot }] : [];
  });
  const visiblePlayers =
    visualMode === "table"
      ? tablePlayers
      : state.players.map((player) => ({ player, slot: undefined }));

  const chooseRoomView = (mode: RoomViewMode) => {
    setRoomView(mode);
    saveRoomView(mode);
  };

  return (
    <div
      className={cn(
        "quest-app",
        `lang-${lang}`,
        presentation && "is-presenting",
        !presentation && `mobile-pane-${mobilePane}`,
      )}
    >
      <header className="quest-header">
        <BrandLockup
          tagline={lang === "ru" ? "оценка как приключение" : "estimation as an adventure"}
        />
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
            {state.passwordProtected ? <LockKeyhole aria-label={t.protectedRoom} /> : null}
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

          <section
            className={cn("party-table", `view-${visualMode}`)}
            aria-labelledby="party-title"
          >
            <div className="party-table-toolbar">
              <div className="party-summary">
                <span className="eyebrow">
                  <Users /> {t.team}
                </span>
                <div className="party-summary-row">
                  <h2 id="party-title">
                    {allVoted ? t.allVoted : t.votesOf(votedCount, state.players.length)}
                  </h2>
                  <div className="vote-progress" aria-hidden="true">
                    <span
                      style={{
                        width: `${state.players.length ? (votedCount / state.players.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
              {!presentation ? (
                <div className="room-view-switch" role="group" aria-label={t.roomViewMode}>
                  <button
                    type="button"
                    className={cn(visualMode === "table" && "is-active")}
                    disabled={!tableEnabled}
                    aria-pressed={visualMode === "table"}
                    title={!tableEnabled ? t.tableCapacityHint : t.tableView}
                    onClick={() => chooseRoomView("table")}
                  >
                    <Table2 aria-hidden="true" />
                    <span>{t.tableView}</span>
                  </button>
                  <button
                    type="button"
                    className={cn(visualMode === "cards" && "is-active")}
                    aria-pressed={visualMode === "cards"}
                    onClick={() => chooseRoomView("cards")}
                  >
                    <LayoutGrid aria-hidden="true" />
                    <span>{t.cardsView}</span>
                  </button>
                </div>
              ) : null}
            </div>
            <div className="table-scene">
              {visualMode === "table" ? (
                <>
                  <picture className="table-scene-art" aria-hidden="true">
                    <source media="(max-width: 759px)" srcSet="/room/table-oval-mobile-720.webp" />
                    <img
                      src="/room/table-oval-desktop-1536.webp"
                      width="1536"
                      height="1024"
                      alt=""
                      decoding="async"
                    />
                  </picture>
                  <div className="table-scene-shade" aria-hidden="true" />
                </>
              ) : null}
              <div
                className={cn("seat-grid", state.revealed && "is-revealed")}
                data-seat-count={state.players.length}
              >
                {visiblePlayers.map(({ player, slot }) => (
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
                    slot={slot}
                    onNameClick={(x, y) => setMenu({ x, y, targetId: player.id })}
                  />
                ))}
              </div>
            </div>
          </section>

          {analysis ? (
            <ConsensusPanel
              t={t}
              lang={lang}
              state={state}
              analysis={analysis}
              isHost={isHost}
              onShowcase={() => setVoteShowcaseOpen(true)}
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

      {!presentation ? (
        <nav
          className="mobile-room-nav"
          aria-label={lang === "ru" ? "Разделы комнаты" : "Room sections"}
        >
          <button
            type="button"
            className={cn(mobilePane === "table" && "is-active")}
            onClick={() => setMobilePane("table")}
          >
            <Users aria-hidden="true" />
            <span>{lang === "ru" ? "Стол" : "Table"}</span>
          </button>
          <button
            type="button"
            className={cn(mobilePane === "chat" && "is-active")}
            onClick={() => {
              setSideTab("chat");
              setMobilePane("chat");
            }}
          >
            <MessageCircle aria-hidden="true" />
            <span>{t.chat}</span>
          </button>
          <button
            type="button"
            className={cn(mobilePane === "history" && "is-active")}
            onClick={() => {
              setSideTab("history");
              setMobilePane("history");
            }}
          >
            <ScrollText aria-hidden="true" />
            <span>{lang === "ru" ? "История" : "History"}</span>
          </button>
        </nav>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {voteStatus === "saved" ? t.voteSaved : voteStatus === "failed" ? t.voteFailed : ""}
      </div>

      {analysis && voteShowcaseOpen ? (
        <VoteShowcase analysis={analysis} lang={lang} t={t} onClose={closeVoteShowcase} />
      ) : null}

      {finalReveal ? (
        <ConsensusReveal
          entry={finalReveal}
          lang={lang}
          t={t}
          onClose={() => {
            if (finalRevealTimer.current) window.clearTimeout(finalRevealTimer.current);
            finalRevealTimer.current = null;
            setFinalReveal(null);
          }}
        />
      ) : null}

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

function BrandLockup({ tagline }: { tagline?: string }) {
  return (
    <div className="brand-lockup">
      <span className="brand-name" role="img" aria-label={APP_NAME}>
        <img
          className="brand-mark"
          src="/brand/questimate-q.webp"
          width="320"
          height="320"
          alt=""
          aria-hidden="true"
          decoding="async"
        />
        <strong aria-hidden="true">UESTIMATE</strong>
      </span>
      {tagline ? <span className="brand-tagline">{tagline}</span> : null}
    </div>
  );
}

function VoteShowcase({
  analysis,
  lang,
  t,
  onClose,
}: {
  analysis: NonNullable<ReturnType<typeof analyzeVotes>>;
  lang: Lang;
  t: (typeof I18N)[Lang];
  onClose: () => void;
}) {
  const showcase = buildVoteShowcase(analysis);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  if (!showcase) return null;

  return (
    <div
      className="vote-showcase"
      role="dialog"
      aria-modal="true"
      aria-labelledby="vote-showcase-title"
    >
      <h2 id="vote-showcase-title" className="sr-only">
        {t.voteShowcaseTitle}
      </h2>
      <div className="vote-showcase-halo" aria-hidden="true" />
      <button
        type="button"
        className="vote-showcase-collapse"
        onClick={onClose}
        aria-label={t.collapseShowcase}
        autoFocus
      >
        <Minimize2 aria-hidden="true" />
        <span>{t.collapseShowcase}</span>
      </button>
      <div className="vote-showcase-stage">
        <ShowcaseCard
          role="majority"
          entry={showcase.majority}
          label={t.majorityChose}
          lang={lang}
        />
        {showcase.minimum ? (
          <ShowcaseCard
            role="minimum"
            entry={showcase.minimum}
            label={t.minimumEstimate}
            lang={lang}
          />
        ) : null}
        {showcase.maximum ? (
          <ShowcaseCard
            role="maximum"
            entry={showcase.maximum}
            label={t.maximumEstimate}
            lang={lang}
          />
        ) : null}
      </div>
    </div>
  );
}

function ShowcaseCard({
  role,
  entry,
  label,
  lang,
}: {
  role: "majority" | "minimum" | "maximum";
  entry: ShowcaseVote;
  label: string;
  lang: Lang;
}) {
  const lore = cardLore(entry.value, entry.variantId);
  const valueLabel = cardFaceLabel(entry.value);
  const accessibleLabel = lore
    ? `${label}: ${valueLabel}, ${lore.name[lang]}, ${lore.title[lang]}`
    : `${label}: ${valueLabel}`;

  return (
    <article className={cn("vote-showcase-item", `is-${role}`)} aria-label={accessibleLabel}>
      <div className="vote-showcase-flight">
        <MagicCard
          value={entry.value}
          variantId={entry.variantId}
          face="front"
          size="hero"
          artwork="character"
          lang={lang}
          eager
        />
      </div>
      <div className="vote-showcase-caption">
        <span>{label}</span>
        <strong>{lore?.name[lang] ?? valueLabel}</strong>
        <small>
          {valueLabel}
          {lore ? ` · ${lore.title[lang]}` : ""}
        </small>
      </div>
    </article>
  );
}

function ConsensusReveal({
  entry,
  lang,
  t,
  onClose,
}: {
  entry: HistoryEntry;
  lang: Lang;
  t: (typeof I18N)[Lang];
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="consensus-reveal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="result-title"
    >
      <button
        type="button"
        className="consensus-reveal-close"
        onClick={onClose}
        aria-label={lang === "ru" ? "Закрыть" : "Close"}
        autoFocus
      >
        <X aria-hidden="true" />
      </button>
      <div className="consensus-reveal-glow" aria-hidden="true" />
      <div className="consensus-reveal-card">
        <MagicCard
          value={entry.result}
          variantId={entry.resultVariantId}
          face="front"
          size="hero"
          artwork="character"
          lang={lang}
          eager
        />
      </div>
      <div className="consensus-reveal-copy">
        <span className="eyebrow">{t.questComplete}</span>
        <h2 id="result-title">{entry.title}</h2>
        <p>{t.partyDecision}</p>
        <strong>{cardFaceLabel(entry.result)}</strong>
      </div>
    </div>
  );
}

function errorText(error: string, t: (typeof I18N)[Lang]): string {
  if (error === "name_required") return t.nameRequired;
  if (error === "invalid_code") return t.invalidRoom;
  if (error === "room_not_found") return t.roomMissing;
  if (error === "password_required") return t.passwordRequired;
  if (error === "wrong_password") return t.wrongPassword;
  if (error === "password_too_short") return t.passwordTooShort;
  return t.actionFailed;
}

function Lobby({
  lang,
  t,
  name,
  codeInput,
  createPassword,
  joinPassword,
  invitedCode,
  busy,
  error,
  onName,
  onCode,
  onCreatePassword,
  onJoinPassword,
  onClearError,
  onCreate,
  onJoin,
  onDemo,
  onLang,
}: {
  lang: Lang;
  t: (typeof I18N)[Lang];
  name: string;
  codeInput: string;
  createPassword: string;
  joinPassword: string;
  invitedCode?: string;
  busy: boolean;
  error: string | null;
  onName: (value: string) => void;
  onCode: (value: string) => void;
  onCreatePassword: (value: string) => void;
  onJoinPassword: (value: string) => void;
  onClearError: () => void;
  onCreate: () => void;
  onJoin: () => void;
  onDemo: () => void;
  onLang: () => void;
}) {
  const [panel, setPanel] = useState<"create" | "join" | "demo" | "help" | null>(
    invitedCode ? "join" : null,
  );

  useEffect(() => {
    if (invitedCode) setPanel("join");
  }, [invitedCode]);

  useEffect(() => {
    if (!panel) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busy) setPanel(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [busy, panel]);

  const openPanel = (next: NonNullable<typeof panel>) => {
    onClearError();
    setPanel(next);
  };

  const closePanel = () => {
    if (busy) return;
    onClearError();
    setPanel(null);
  };

  const isRu = lang === "ru";

  return (
    <main className="lobby-page">
      <picture className="lobby-backdrop" aria-hidden="true">
        <source media="(max-width: 640px)" srcSet="/hero/tavern-mobile-768.webp" />
        <img
          src="/hero/tavern-1586.webp"
          srcSet="/hero/tavern-1200.webp 1200w, /hero/tavern-1586.webp 1586w"
          sizes="100vw"
          width="1586"
          height="992"
          alt=""
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </picture>
      <div className="lobby-shade" aria-hidden="true" />
      <header className="lobby-nav">
        <BrandLockup />
        <div className="lobby-nav-actions">
          <button type="button" className="lobby-help" onClick={() => openPanel("help")}>
            <CircleHelp aria-hidden="true" /> {isRu ? "Как играть" : "How it works"}
          </button>
          <Button type="button" variant="lang" onClick={onLang}>
            {isRu ? "EN" : "RU"}
          </Button>
        </div>
      </header>

      <section className="lobby-hero">
        <div className="lobby-copy">
          <span className="eyebrow">
            <Sparkles aria-hidden="true" /> {isRu ? "ПЛАНИРОВОЧНЫЙ ПОКЕР" : "PLANNING POKER"}
          </span>
          <h1>{isRu ? "Соберите команду за одним столом" : "Bring the team to one table"}</h1>
          <p>
            {isRu
              ? "Все выбирают карту. Оценки открываются одновременно. Договориться становится проще."
              : "Everyone picks a card. Estimates are revealed together. Reaching agreement gets easier."}
          </p>
          <div className="lobby-actions">
            <Button type="button" onClick={() => openPanel("create")}>
              {t.create}
            </Button>
            <Button type="button" variant="ghost" onClick={() => openPanel("join")}>
              {isRu ? "Войти по коду" : "Join with a code"}
            </Button>
          </div>
          <p className="lobby-lifetime">
            <LockKeyhole aria-hidden="true" />
            {isRu
              ? "Без регистрации · Комната удалится через 24 часа"
              : "No sign-up · The room is deleted after 24 hours"}
          </p>
          <button type="button" className="demo-link" onClick={() => openPanel("demo")}>
            <span aria-hidden="true">
              <Play />
            </span>
            {isRu ? "Посмотреть демо" : "Explore the demo"}
          </button>
        </div>
      </section>

      {panel ? (
        <div className="lobby-modal-backdrop" role="presentation" onMouseDown={closePanel}>
          <section
            className="lobby-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="lobby-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="lobby-modal-close"
              aria-label={isRu ? "Закрыть" : "Close"}
              onClick={closePanel}
            >
              <X aria-hidden="true" />
            </button>

            {panel === "help" ? (
              <div className="how-to-play">
                <span className="eyebrow">{isRu ? "КАК ЭТО РАБОТАЕТ" : "HOW IT WORKS"}</span>
                <h2 id="lobby-modal-title">
                  {isRu ? "Три шага — и оценка готова" : "Three steps to an estimate"}
                </h2>
                <ol>
                  <li>
                    <strong>1</strong>
                    <span>{isRu ? "Ведущий показывает задачу." : "The host shares a task."}</span>
                  </li>
                  <li>
                    <strong>2</strong>
                    <span>{isRu ? "Каждый выбирает карту." : "Everyone picks a card."}</span>
                  </li>
                  <li>
                    <strong>3</strong>
                    <span>
                      {isRu
                        ? "Карты открываются вместе — можно обсудить разницу."
                        : "Cards are revealed together, ready to discuss."}
                    </span>
                  </li>
                </ol>
                <Button type="button" onClick={() => openPanel("create")}>
                  {t.create}
                </Button>
              </div>
            ) : (
              <form
                className="lobby-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (panel === "create") onCreate();
                  else if (panel === "join") onJoin();
                  else onDemo();
                }}
              >
                <span className="eyebrow">
                  {panel === "create"
                    ? isRu
                      ? "НОВАЯ КОМНАТА"
                      : "NEW ROOM"
                    : panel === "demo"
                      ? isRu
                        ? "ДЕМО-КОМНАТА"
                        : "DEMO ROOM"
                      : isRu
                        ? "ПО ПРИГЛАШЕНИЮ"
                        : "WITH AN INVITE"}
                </span>
                <h2 id="lobby-modal-title">
                  {panel === "create"
                    ? isRu
                      ? "Как вас представить команде?"
                      : "What should the team call you?"
                    : panel === "demo"
                      ? isRu
                        ? "Заглянуть за готовый стол"
                        : "Join a ready-made table"
                      : invitedCode
                        ? t.invited(invitedCode)
                        : isRu
                          ? "Введите код комнаты"
                          : "Enter the room code"}
                </h2>

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
                />

                {panel === "create" ? (
                  <>
                    <label className="field-label" htmlFor="create-password">
                      {t.createPassword}
                    </label>
                    <Input
                      id="create-password"
                      type="password"
                      value={createPassword}
                      minLength={4}
                      maxLength={128}
                      autoComplete="new-password"
                      placeholder={t.passwordPlaceholder}
                      onChange={(event) => onCreatePassword(event.target.value)}
                    />
                    <p className="form-hint">{t.passwordHint}</p>
                  </>
                ) : null}

                {panel === "join" ? (
                  <>
                    <label className="field-label" htmlFor="code">
                      {t.roomCode}
                    </label>
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
                    />
                    <label className="field-label" htmlFor="join-password">
                      {t.joinPassword}
                    </label>
                    <Input
                      id="join-password"
                      type="password"
                      value={joinPassword}
                      minLength={4}
                      maxLength={128}
                      autoComplete="current-password"
                      placeholder={t.passwordPlaceholder}
                      onChange={(event) => onJoinPassword(event.target.value)}
                    />
                  </>
                ) : null}

                {panel === "demo" ? <p className="form-hint">{t.demoText}</p> : null}
                {error ? (
                  <div className="lobby-error" role="alert">
                    {errorText(error, t)}
                  </div>
                ) : null}
                <Button type="submit" className="w-full" disabled={busy}>
                  {busy
                    ? t.connecting
                    : panel === "create"
                      ? t.create
                      : panel === "demo"
                        ? t.tryDemo
                        : t.join}
                </Button>
                {panel === "create" ? (
                  <p className="privacy-hint">
                    <LockKeyhole aria-hidden="true" /> {t.roomLifetime}
                  </p>
                ) : null}
              </form>
            )}
          </section>
        </div>
      ) : null}
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
      <span className="task-scroll-art" aria-hidden="true">
        <img src="/room/task-scroll.webp" alt="" />
      </span>
      <div className="task-card-copy">
        <span className="eyebrow">{t.currentTask}</span>
        <h1>{task.title}</h1>
        {task.description ? (
          <p className={cn("task-copy", clamp && "is-clamped")}>{task.description}</p>
        ) : null}
        {long ? (
          <button type="button" className="text-link" onClick={onToggle}>
            {clamp ? t.expand : t.collapse}
          </button>
        ) : null}
      </div>
      <span className="task-corner task-corner-tl" aria-hidden="true" />
      <span className="task-corner task-corner-tr" aria-hidden="true" />
      <span className="task-corner task-corner-bl" aria-hidden="true" />
      <span className="task-corner task-corner-br" aria-hidden="true" />
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
  slot,
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
  slot?: number;
  onNameClick: (x: number, y: number) => void;
}) {
  const snow = player.snowUntil > now;
  const displayName = `${player.name}${isYou ? (lang === "ru" ? " · вы" : " · you") : ""}${snow ? " ☃" : ""}`;
  let face: "back" | "front" | "empty" = "empty";
  if (task && player.voted && !revealed) face = "back";
  else if (revealed && player.vote) face = "front";
  return (
    <article
      className={cn(
        "player-seat",
        isYou && "is-you",
        !player.online && "is-away",
        outlier && revealed && "is-outlier",
      )}
      data-table-slot={slot}
    >
      <div className="player-meta" title={displayName}>
        <button
          type="button"
          disabled={isYou}
          title={displayName}
          aria-label={displayName}
          onClick={(event) => onNameClick(event.clientX, event.clientY)}
        >
          {player.isHost && player.online ? <Crown aria-hidden="true" /> : null}
          <span className={cn("player-name", displayName.length > 15 && "is-long")}>
            {displayName}
          </span>
        </button>
        <span>{!player.online ? t.away : player.voted ? t.voted : t.waiting}</span>
      </div>
      <div className="table-card-stage">
        <MagicCard
          value={player.vote}
          variantId={player.variantId}
          backId={backId}
          face={face}
          size={revealed ? "hero" : "seat"}
          lang={lang}
          outlier={outlier && revealed}
        />
      </div>
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
  onShowcase,
  onAsk,
}: {
  t: (typeof I18N)[Lang];
  lang: Lang;
  state: Snapshot;
  analysis: NonNullable<ReturnType<typeof analyzeVotes>>;
  isHost: boolean;
  onShowcase: () => void;
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
    insight = t.votedWhileMost(
      analysis.far.name,
      cardFaceLabel(analysis.far.vote),
      cardFaceLabel(analysis.mode),
    );

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
          <dd>{cardFaceLabel(analysis.median)}</dd>
        </div>
        <div>
          <dt>{t.mode}</dt>
          <dd>{cardFaceLabel(analysis.mode)}</dd>
        </div>
        <div>
          <dt>{t.range}</dt>
          <dd>{cardFaceLabel(analysis.range)}</dd>
        </div>
        <div>
          <dt>{t.outliers}</dt>
          <dd>
            {outlierValues.length
              ? outlierValues.map((value) => cardFaceLabel(value)).join(", ")
              : t.none}
          </dd>
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
      <div className="consensus-actions">
        {isHost && analysis.askOrder.length ? (
          <Button type="button" onClick={onAsk}>
            {t.askOutliers}
          </Button>
        ) : null}
        <Button type="button" variant="ghost" onClick={onShowcase}>
          <Sparkles aria-hidden="true" />
          {t.expandShowcase}
        </Button>
      </div>
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
                {cardFaceLabel(value)}
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
              <span>{cardFaceLabel(item.result)}</span>
            </div>
            <p>
              {item.votes.map((vote) => `${vote.name}: ${cardFaceLabel(vote.value)}`).join(" · ")}
            </p>
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
