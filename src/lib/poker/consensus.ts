import { RANK_SIZE, SCALE, SIZE_RANK, type CardValue, type PublicPlayer } from "./types";

export type Consensus = {
  values: CardValue[];
  mode: CardValue;
  consensusPct: number;
  median: string;
  mean: string;
  range: string;
  level: "high" | "medium" | "low";
  outliers: PublicPlayer[];
  askOrder: PublicPlayer[];
  far: PublicPlayer | null;
  sized: PublicPlayer[];
};

function scaleIndex(v: string): number {
  const i = SCALE.indexOf(v as CardValue);
  return i < 0 ? 99 : i;
}

export function analyzeVotes(players: PublicPlayer[], revealed: boolean): Consensus | null {
  if (!revealed) return null;
  const ballots = players.filter((p): p is PublicPlayer & { vote: CardValue } => Boolean(p.vote));
  if (!ballots.length) return null;

  const values = ballots
    .map((p) => p.vote)
    .sort((a, b) => scaleIndex(a) - scaleIndex(b));

  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] || 0) + 1;
  const mode = Object.entries(counts).sort(
    (a, b) => b[1] - a[1] || (SIZE_RANK[b[0]] || 0) - (SIZE_RANK[a[0]] || 0),
  )[0][0] as CardValue;
  const consensusPct = Math.round((counts[mode] / values.length) * 100);

  const sized = ballots
    .filter((p) => SIZE_RANK[p.vote])
    .map((p) => ({ ...p, rank: SIZE_RANK[p.vote] }))
    .sort((a, b) => a.rank - b.rank);

  let median = "\u2014";
  let mean = "\u2014";
  let range = "\u2014";
  if (sized.length) {
    const mid = Math.floor((sized.length - 1) / 2);
    const medRank =
      sized.length % 2 ? sized[mid].rank : (sized[mid].rank + sized[mid + 1].rank) / 2;
    median = RANK_SIZE[Math.round(medRank)] || String(medRank);
    const avg = sized.reduce((s, p) => s + p.rank, 0) / sized.length;
    mean = (Math.round(avg * 10) / 10).toFixed(1);
    range = `${RANK_SIZE[sized[0].rank]}\u2013${RANK_SIZE[sized[sized.length - 1].rank]}`;
  }

  const level = consensusPct >= 80 ? "high" : consensusPct >= 50 ? "medium" : "low";
  const outliers = ballots.filter((p) => p.vote !== mode);

  const sizedOutliers = sized.filter((p) => p.vote !== mode);
  const maxRank = sizedOutliers.length ? Math.max(...sizedOutliers.map((p) => p.rank)) : 0;
  const minRank = sizedOutliers.length ? Math.min(...sizedOutliers.map((p) => p.rank)) : 0;
  const highs = sizedOutliers.filter((p) => p.rank === maxRank);
  const lows = sizedOutliers.filter((p) => p.rank === minRank && p.rank !== maxRank);
  const midOut = sizedOutliers.filter((p) => p.rank !== maxRank && p.rank !== minRank);
  const specials = outliers.filter((p) => !SIZE_RANK[p.vote]);
  const seen = new Set<string>();
  const askOrder: PublicPlayer[] = [];
  for (const p of [...highs, ...lows, ...midOut, ...specials]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    askOrder.push(p);
  }

  const far =
    outliers.slice().sort((a, b) => (SIZE_RANK[b.vote] || 0) - (SIZE_RANK[a.vote] || 0))[0] ??
    null;

  return {
    values,
    mode,
    consensusPct,
    median,
    mean,
    range,
    level,
    outliers,
    askOrder,
    far,
    sized,
  };
}
