import { Check, Copy, RotateCcw, Sparkles, Users, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MagicCard } from "@/components/poker/MagicCard";
import { Button } from "@/components/ui/button";
import { cardFaceLabel } from "@/lib/poker/cards";
import { analyzeHistoryVotes, type HistoryVoteAnalysis } from "@/lib/poker/history";
import { I18N, type Lang } from "@/lib/poker/i18n";
import { SCALE, type HistoryEntry } from "@/lib/poker/types";

type HistoryPanelProps = {
  t: (typeof I18N)[Lang];
  lang: Lang;
  history: HistoryEntry[];
  isHost: boolean;
  hasActiveTask: boolean;
  onReestimate: (entry: HistoryEntry) => void;
};

function locale(lang: Lang): string {
  return lang === "ru" ? "ru-RU" : "en-US";
}

function compactTime(timestamp: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function fullTime(timestamp: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function durationLabel(entry: HistoryEntry, lang: Lang): string | null {
  if (!entry.startedAt || entry.ts <= entry.startedAt) return null;
  const minutes = Math.max(1, Math.round((entry.ts - entry.startedAt) / 60_000));
  if (minutes < 60) return lang === "ru" ? `${minutes} мин` : `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!rest) return lang === "ru" ? `${hours} ч` : `${hours} hr`;
  return lang === "ru" ? `${hours} ч ${rest} мин` : `${hours} hr ${rest} min`;
}

function HistoryListItem({
  item,
  lang,
  t,
  onOpen,
}: {
  item: HistoryEntry;
  lang: Lang;
  t: (typeof I18N)[Lang];
  onOpen: () => void;
}) {
  const analysis = analyzeHistoryVotes(item.votes);
  return (
    <button type="button" className="history-item" onClick={onOpen} aria-haspopup="dialog">
      <span className="history-item-heading">
        <strong>{item.title}</strong>
        <span className="history-result-badge">{cardFaceLabel(item.result)}</span>
      </span>
      <span className="history-item-meta">
        <time dateTime={new Date(item.ts).toISOString()}>{compactTime(item.ts, lang)}</time>
        <span>{t.historyVotesCount(analysis.totalVotes)}</span>
        <span>{t.historyAgreement(analysis.consensusPct)}</span>
        {analysis.range !== "—" ? <span>{cardFaceLabel(analysis.range)}</span> : null}
        {analysis.specialVotes ? <span>？/ ☕ · {analysis.specialVotes}</span> : null}
      </span>
    </button>
  );
}

function resultCopy(
  item: HistoryEntry,
  analysis: HistoryVoteAnalysis,
  lang: Lang,
  t: (typeof I18N)[Lang],
): string {
  const lines = [
    item.title,
    `${t.finalEstimate}: ${cardFaceLabel(item.result)}`,
    `${t.consensus}: ${analysis.consensusPct}%`,
    `${t.mode}: ${cardFaceLabel(analysis.mode) || "—"}`,
    `${t.median}: ${cardFaceLabel(analysis.median)}`,
    `${t.range}: ${cardFaceLabel(analysis.range)}`,
    `${t.historyCompleted}: ${fullTime(item.ts, lang)}`,
  ];
  if (item.decisionNote) lines.push(`${t.historyDecision}: ${item.decisionNote}`);
  lines.push(
    "",
    ...analysis.groups.map((group) => `${cardFaceLabel(group.value)} — ${group.names.join(", ")}`),
  );
  return lines.join("\n");
}

function HistoryDetails({
  item,
  lang,
  t,
  isHost,
  hasActiveTask,
  onClose,
  onReestimate,
}: {
  item: HistoryEntry;
  lang: Lang;
  t: (typeof I18N)[Lang];
  isHost: boolean;
  hasActiveTask: boolean;
  onClose: () => void;
  onReestimate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const analysis = useMemo(() => analyzeHistoryVotes(item.votes), [item.votes]);
  const duration = durationLabel(item, lang);
  const rounds = item.rounds ?? [];
  const maxGroup = Math.max(1, ...analysis.groups.map((group) => group.names.length));
  const majorityDiffers = analysis.mode && analysis.mode !== item.result;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <div className="history-detail-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className="history-detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="history-detail-header">
          <div>
            <span className="eyebrow">
              <Sparkles aria-hidden="true" /> {t.history}
            </span>
            <h2 id="history-detail-title">{item.title}</h2>
            <p>
              {t.historyCompleted} {fullTime(item.ts, lang)}
              {duration ? ` · ${duration}` : ""}
              {item.finalizedBy ? ` · ${t.historyFinalizedBy(item.finalizedBy)}` : ""}
            </p>
          </div>
          <button
            type="button"
            className="history-detail-close"
            aria-label={t.historyClose}
            onClick={onClose}
            autoFocus
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className="history-detail-scroll">
          <section className="history-decision-hero">
            <div className="history-decision-card">
              <MagicCard
                value={item.result}
                variantId={item.resultVariantId}
                face="front"
                size="hero"
                artwork="character"
                lang={lang}
              />
            </div>
            <div className="history-decision-summary">
              <span className="eyebrow">{t.partyDecision}</span>
              <strong>{cardFaceLabel(item.result)}</strong>
              <div className="history-detail-meta">
                <span>
                  <Users aria-hidden="true" /> {t.historyVotesCount(analysis.totalVotes)}
                </span>
                <span>{t.historyAgreement(analysis.consensusPct)}</span>
                {rounds.length > 1 ? <span>{t.historyRoundsCount(rounds.length)}</span> : null}
              </div>
              {item.decisionNote ? (
                <blockquote>
                  <span>{t.historyDecision}</span>
                  <p>{item.decisionNote}</p>
                </blockquote>
              ) : null}
            </div>
          </section>

          {majorityDiffers ? (
            <div className="history-majority-note">
              <Sparkles aria-hidden="true" />
              {t.historyFinalVsMajority(cardFaceLabel(item.result), cardFaceLabel(analysis.mode))}
            </div>
          ) : null}

          <section className="history-detail-section">
            <h3>{t.historyDescription}</h3>
            <p className="history-description">{item.description || t.historyNoDescription}</p>
          </section>

          <section className="history-stat-grid" aria-label={t.consensus}>
            <div>
              <span>{t.consensus}</span>
              <strong>{analysis.consensusPct}%</strong>
            </div>
            <div>
              <span>{t.mode}</span>
              <strong>{cardFaceLabel(analysis.mode) || "—"}</strong>
            </div>
            <div>
              <span>{t.median}</span>
              <strong>{cardFaceLabel(analysis.median)}</strong>
            </div>
            <div>
              <span>{t.range}</span>
              <strong>{cardFaceLabel(analysis.range)}</strong>
            </div>
          </section>

          <section className="history-detail-section">
            <h3>{t.historyDistribution}</h3>
            <div className="history-distribution" aria-label={t.historyDistribution}>
              {SCALE.map((value) => {
                const count =
                  analysis.groups.find((group) => group.value === value)?.names.length ?? 0;
                return (
                  <div key={value} className={count ? "has-votes" : undefined}>
                    <span>{count || ""}</span>
                    <i aria-hidden="true">
                      <b
                        style={{
                          height: count ? `${Math.max(14, (count / maxGroup) * 100)}%` : "0",
                        }}
                      />
                    </i>
                    <strong>{cardFaceLabel(value)}</strong>
                  </div>
                );
              })}
            </div>
          </section>

          {analysis.minimum &&
          analysis.maximum &&
          analysis.minimum.value !== analysis.maximum.value ? (
            <section className="history-detail-section">
              <h3>{t.historyEdgeVotes}</h3>
              <div className="history-edge-grid">
                <div>
                  <span>{t.historyMinimum}</span>
                  <strong>{cardFaceLabel(analysis.minimum.value)}</strong>
                  <p>{analysis.minimum.names.join(", ")}</p>
                </div>
                <div>
                  <span>{t.historyMaximum}</span>
                  <strong>{cardFaceLabel(analysis.maximum.value)}</strong>
                  <p>{analysis.maximum.names.join(", ")}</p>
                </div>
              </div>
            </section>
          ) : null}

          <section className="history-detail-section">
            <h3>{t.historyIndividualVotes}</h3>
            <div className="history-vote-groups">
              {analysis.groups.map((group) => (
                <div key={group.value}>
                  <strong>{cardFaceLabel(group.value)}</strong>
                  <span>{group.names.join(", ")}</span>
                </div>
              ))}
            </div>
          </section>

          {rounds.length > 1 ? (
            <section className="history-detail-section">
              <h3>{t.historyRoundsCount(rounds.length)}</h3>
              <div className="history-rounds">
                {rounds.map((round, index) => (
                  <article key={round.id}>
                    <header>
                      <strong>{t.historyRound(index + 1)}</strong>
                      <time dateTime={new Date(round.ts).toISOString()}>
                        {compactTime(round.ts, lang)}
                      </time>
                    </header>
                    <div>
                      {analyzeHistoryVotes(round.votes).groups.map((group) => (
                        <span key={group.value}>
                          <b>{cardFaceLabel(group.value)}</b> {group.names.join(", ")}
                        </span>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : null}
        </div>

        <footer className="history-detail-actions">
          <Button
            type="button"
            variant="ghost"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(resultCopy(item, analysis, lang, t));
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
          >
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? t.historyCopied : t.historyCopy}
          </Button>
          {isHost ? (
            <Button
              type="button"
              disabled={hasActiveTask}
              title={hasActiveTask ? t.historyReestimateBlocked : undefined}
              onClick={onReestimate}
            >
              <RotateCcw aria-hidden="true" /> {t.historyReestimate}
            </Button>
          ) : null}
        </footer>
      </section>
    </div>
  );
}

export function HistoryPanel({
  t,
  lang,
  history,
  isHost,
  hasActiveTask,
  onReestimate,
}: HistoryPanelProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = history.find((entry) => entry.id === selectedId) ?? null;

  return (
    <>
      <div className="history-panel">
        {!history.length ? (
          <p className="empty-copy">{t.historyEmpty}</p>
        ) : (
          history.map((item) => (
            <HistoryListItem
              key={item.id}
              item={item}
              lang={lang}
              t={t}
              onOpen={() => setSelectedId(item.id)}
            />
          ))
        )}
      </div>
      {selected
        ? createPortal(
            <HistoryDetails
              item={selected}
              lang={lang}
              t={t}
              isHost={isHost}
              hasActiveTask={hasActiveTask}
              onClose={() => setSelectedId(null)}
              onReestimate={() => {
                onReestimate(selected);
                setSelectedId(null);
              }}
            />,
            document.body,
          )
        : null}
    </>
  );
}
