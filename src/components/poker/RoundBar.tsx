import { Check, Eye, RotateCcw, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cardFaceLabel } from "@/lib/poker/cards";
import type { Lang } from "@/lib/poker/i18n";
import type { CardValue, PublicPlayer, Snapshot } from "@/lib/poker/types";
import { cn } from "@/lib/cn";

export function VoteBars({
  players,
  scale,
  lang,
  selected,
  onPick,
}: {
  players: PublicPlayer[];
  scale: readonly CardValue[];
  lang: Lang;
  selected?: CardValue | null;
  onPick?: (value: CardValue) => void;
}) {
  const counts = scale.map((value) => players.filter((p) => p.vote === value).length);
  const max = Math.max(1, ...counts);
  return (
    <div
      className={cn("estimate-bars", onPick && "is-picker")}
      aria-label={lang === "ru" ? "Распределение голосов" : "Vote distribution"}
    >
      {scale.map((value, index) => {
        const label = `${cardFaceLabel(value)} · ${lang === "ru" ? "голосов" : "votes"}: ${counts[index]}`;
        const contents = (
          <>
            <b className="estimate-count">{counts[index]}</b>
            <span className="estimate-track" aria-hidden="true">
              <i style={{ height: `${(counts[index] / max) * 100}%` }} />
            </span>
            <strong>{cardFaceLabel(value)}</strong>
          </>
        );
        return onPick ? (
          <button
            key={value}
            type="button"
            data-estimate={cardFaceLabel(value)}
            className={cn(selected === value && "is-selected")}
            aria-label={label}
            aria-pressed={selected === value}
            onClick={() => onPick(value)}
          >
            {contents}
          </button>
        ) : (
          <div key={value} data-estimate={cardFaceLabel(value)} aria-label={label}>
            {contents}
          </div>
        );
      })}
    </div>
  );
}

export function RoundBar({
  state,
  lang,
  canManage,
  selected,
  onPick,
  onReveal,
  onReset,
  onFinalize,
}: {
  state: Snapshot;
  lang: Lang;
  canManage: boolean;
  selected?: CardValue | null;
  onPick?: (value: CardValue) => void;
  onReveal?: () => void;
  onReset: () => void;
  onFinalize?: () => void;
}) {
  const ru = lang === "ru";
  const count = state.players.filter((p) => p.voted).length;
  return (
    <section
      className={cn("round-bar", state.revealed && "is-open")}
      aria-label={ru ? "Управление раундом" : "Round controls"}
    >
      <div className="round-status-copy">
        <span className="round-status-icon" aria-hidden="true">
          {state.revealed ? <Eye /> : <Swords />}
        </span>
        <div>
          <h2>
            {state.revealed
              ? ru
                ? "Карты открыты!"
                : "Cards revealed!"
              : ru
                ? "Идёт голосование"
                : "Voting in progress"}
          </h2>
          <p>
            {state.revealed
              ? canManage
                ? ru
                  ? "Выберите и утвердите итоговую оценку"
                  : "Choose and confirm the final estimate"
                : ru
                  ? "Команда обсуждает итоговую оценку"
                  : "The party is discussing the estimate"
              : ru
                ? `${count} из ${state.players.length} карт на столе`
                : `${count} of ${state.players.length} cards on the table`}
          </p>
        </div>
      </div>
      {state.revealed && canManage && onPick && (
        <VoteBars
          players={state.players}
          scale={state.scale}
          lang={lang}
          selected={selected}
          onPick={onPick}
        />
      )}
      {canManage && (
        <div className="round-actions">
          <Button
            type="button"
            variant="ghost"
            className="round-reset"
            onClick={onReset}
            aria-label={
              state.revealed
                ? ru
                  ? "Переголосовать"
                  : "Vote again"
                : ru
                  ? "Сбросить голоса"
                  : "Reset votes"
            }
          >
            <RotateCcw />
            <span>
              {state.revealed
                ? ru
                  ? "Переголосовать"
                  : "Vote again"
                : ru
                  ? "Сбросить голоса"
                  : "Reset votes"}
            </span>
          </Button>
          {state.revealed ? (
            <Button type="button" disabled={!selected} onClick={onFinalize}>
              <Check />
              {ru ? "Утвердить итоговую оценку" : "Confirm final estimate"}
            </Button>
          ) : (
            <Button type="button" onClick={onReveal}>
              <Eye />
              {ru ? "Открыть карты" : "Reveal cards"}
              <b className="round-count">
                {count}/{state.players.length}
              </b>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
