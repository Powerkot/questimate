import type { CSSProperties } from "react";
import type { PublicPlayer } from "@/lib/poker/types";
import type { Lang } from "@/lib/poker/i18n";
import { cardFaceLabel } from "@/lib/poker/cards";

const SIZES = ["xs", "s", "m", "l", "xl", "XXL"] as const;

export function EstimateDetailChart({
  players,
  viewerId,
  lang,
}: {
  players: PublicPlayer[];
  viewerId: string;
  lang: Lang;
}) {
  const ru = lang === "ru";
  const buckets = SIZES.map((value) => ({
    value,
    voters: players.filter((p) => !p.spectator && p.vote === value),
  }));
  const occupied = buckets.flatMap((b, i) => (b.voters.length ? [i] : []));
  if (!occupied.length)
    return <p className="form-hint">{ru ? "Нет оценок от XS до XXL" : "No size estimates yet"}</p>;
  const first = occupied[0];
  const last = occupied[occupied.length - 1];
  const maximum = Math.max(...buckets.map((b) => b.voters.length));
  const own = players.find((p) => p.id === viewerId && !p.spectator)?.vote;
  const ownIndex = SIZES.findIndex((value) => value === own);
  const modeIndex = buckets.findIndex((b) => b.voters.length === maximum);
  const markerIndex = ownIndex >= 0 ? ownIndex : modeIndex;
  const markerLabel = `${cardFaceLabel(SIZES[markerIndex])} · ${ownIndex >= 0 ? (ru ? "ваша оценка" : "your estimate") : ru ? "чаще всего" : "most common"}`;
  const range =
    first === last
      ? cardFaceLabel(SIZES[first])
      : `${cardFaceLabel(SIZES[first])}–${cardFaceLabel(SIZES[last])}`;
  return (
    <figure
      className="estimate-detail-chart"
      aria-label={
        ru
          ? `Распределение голосов. Диапазон ${range}. ${markerLabel}`
          : `Vote distribution. Range ${range}. ${markerLabel}`
      }
    >
      <div
        className="estimate-detail-plot"
        style={
          {
            "--marker-position": `${((markerIndex + 0.5) * 100) / 6}%`,
            "--marker-anchor": markerIndex === 0 ? "20%" : markerIndex === 5 ? "80%" : "50%",
          } as CSSProperties
        }
      >
        <div
          className="estimate-detail-range"
          aria-hidden="true"
          style={{ left: `${(first * 100) / 6}%`, width: `${((last - first + 1) * 100) / 6}%` }}
        />
        <div className="estimate-detail-marker">
          <span>{markerLabel}</span>
        </div>
        {buckets.map(({ value, voters }, index) => (
          <div className="estimate-detail-column" key={value}>
            <span className="estimate-detail-count">{voters.length}</span>
            <div
              className="estimate-detail-bar"
              data-in-range={index >= first && index <= last}
              style={{ height: voters.length ? `${(voters.length / maximum) * 168}px` : "4px" }}
            />
          </div>
        ))}
      </div>
      <div className="estimate-detail-labels">
        {buckets.map(({ value, voters }) => (
          <div key={value}>
            <b>{cardFaceLabel(value)}</b>
            <span>{voters.map((p) => p.name).join(", ") || "—"}</span>
          </div>
        ))}
      </div>
      <figcaption>
        {ru ? "Диапазон оценок" : "Estimate range"}: <b>{range}</b>{" "}
        <span>· {ru ? "Высота столбца — количество голосов" : "Bar height shows vote count"}</span>
      </figcaption>
    </figure>
  );
}
