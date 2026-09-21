import { SIZE_RANK, type CardValue, type PublicPlayer } from "./types.ts";

export type Consensus = {
  values: CardValue[];
  mode: CardValue;
  consensusPct: number;
  median: string;
  range: string;
  level: "high" | "medium" | "low";
  outliers: PublicPlayer[];
  askOrder: PublicPlayer[];
  far: PublicPlayer | null;
  sized: PublicPlayer[];
  specials: PublicPlayer[];
};

function mostCommon(values: CardValue[]): CardValue {
  const counts = new Map<CardValue, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => {
    const countDiff = b[1] - a[1];
    if (countDiff) return countDiff;
    return (SIZE_RANK[a[0]] || 99) - (SIZE_RANK[b[0]] || 99);
  })[0][0];
}

export function analyzeVotes(players: PublicPlayer[], revealed: boolean): Consensus | null {
  if (!revealed) return null;
  const ballots = players.filter((p): p is PublicPlayer & { vote: CardValue } => Boolean(p.vote));
  if (!ballots.length) return null;

  const sized = ballots
    .filter((p) => Boolean(SIZE_RANK[p.vote]))
    .slice()
    .sort((a, b) => SIZE_RANK[a.vote] - SIZE_RANK[b.vote]);
  const specials = ballots.filter((p) => !SIZE_RANK[p.vote]);
  const source = sized.length ? sized : ballots;
  const mode = mostCommon(source.map((p) => p.vote));
  const modeCount = source.filter((p) => p.vote === mode).length;
  const consensusPct = Math.round((modeCount / source.length) * 100);

  let median = "—";
  let range = "—";
  if (sized.length) {
    const left = sized[Math.floor((sized.length - 1) / 2)].vote;
    const right = sized[Math.ceil((sized.length - 1) / 2)].vote;
    median = left === right ? left : `${left}–${right}`;
    range = `${sized[0].vote}–${sized[sized.length - 1].vote}`;
  }

  const modeRank = SIZE_RANK[mode] || 0;
  const differing = modeRank ? sized.filter((p) => p.vote !== mode) : [];
  const maxDistance = differing.length
    ? Math.max(...differing.map((p) => Math.abs(SIZE_RANK[p.vote] - modeRank)))
    : 0;
  const outliers = differing.filter((p) => Math.abs(SIZE_RANK[p.vote] - modeRank) === maxDistance);
  const askOrder = outliers.slice().sort((a, b) => SIZE_RANK[b.vote] - SIZE_RANK[a.vote]);
  const far = askOrder[0] ?? null;
  const level = consensusPct >= 80 ? "high" : consensusPct >= 50 ? "medium" : "low";
  const values = ballots
    .map((p) => p.vote)
    .sort((a, b) => (SIZE_RANK[a] || 99) - (SIZE_RANK[b] || 99));

  return {
    values,
    mode,
    consensusPct,
    median,
    range,
    level,
    outliers,
    askOrder,
    far,
    sized,
    specials,
  };
}
