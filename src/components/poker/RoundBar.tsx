import type { ReactNode } from "react";
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
  const sizes = scale.filter((value) => value !== "?" && value !== "☕");
  const voters = sizes.map((value) => players.filter((p) => !p.spectator && p.vote === value));
  const counts = voters.map((group) => group.length);
  const max = Math.max(1, ...counts);
  return (
    <div
      className={cn("estimate-bars", onPick && "is-picker")}
      aria-label={lang === "ru" ? "Распределение голосов" : "Vote distribution"}
    >
      {sizes.map((value, index) => {
        const names = voters[index].map((player) => player.name).join(", ");
        const label = `${cardFaceLabel(value)} · ${lang === "ru" ? "голосов" : "votes"}: ${counts[index]}${names ? ` · ${names}` : ""}`;
        const contents = (
          <>
            <b className="estimate-count">{counts[index]}</b>
            <span className="estimate-track" aria-hidden="true">
              <i style={{ height: `${(counts[index] / max) * 100}%` }} />
            </span>
            <strong>{cardFaceLabel(value)}</strong>
            <span className="estimate-voters">{names || "—"}</span>
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
  showDistribution = true,
  children,
}: {
  state: Snapshot;
  lang: Lang;
  canManage: boolean;
  selected?: CardValue | null;
  onPick?: (value: CardValue) => void;
  onReveal?: () => void;
  onReset: () => void;
  onFinalize?: () => void;
  showDistribution?: boolean;
  children?: ReactNode;
}) {
  const ru = lang === "ru";
  const voters = state.players.filter((p) => !p.spectator);
  const count = voters.filter((p) => p.voted).length;
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
          <h2 className="round-heading">
            <span className="round-step">
              {ru ? "Шаг" : "Step"} {state.revealed ? "2/2" : "1/2"}
            </span>
            <span>
              {state.revealed ? (
                canManage ? (
                  <>
                    <span className="round-prompt-pulse">{ru ? "Нажмите" : "Click"}</span>
                    {ru
                      ? " на столбец, чтобы выбрать итоговую оценку"
                      : " a bar to choose the final estimate"}
                  </>
                ) : ru ? (
                  "Ведущий выбирает итоговую оценку"
                ) : (
                  "The host is choosing the final estimate"
                )
              ) : ru ? (
                "Идёт голосование"
              ) : (
                "Voting in progress"
              )}
            </span>
          </h2>
          {!state.revealed && (
            <p>
              {ru
                ? `${count} из ${voters.length} карт на столе`
                : `${count} of ${voters.length} cards on the table`}
            </p>
          )}
        </div>
      </div>
      {state.revealed && showDistribution && canManage && onPick && (
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
                {count}/{voters.length}
              </b>
            </Button>
          )}
        </div>
      )}
      {children && <div className="round-analysis">{children}</div>}
    </section>
  );
}
