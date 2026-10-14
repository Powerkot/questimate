import { SIZE_RANK, type CardValue, type PublicPlayer } from "./types.ts";

export type Consensus = {
  values: CardValue[];
  mode: CardValue;
  consensusPct: number;
  median: string;
  range: string;
  level: "high" | "medium" | "low";
  outliers: PublicPlayer[];
  far: PublicPlayer | null;
  sized: PublicPlayer[];
  specials: PublicPlayer[];
};

export type ShowcaseVote = {
  playerId: string;
  playerName: string;
  value: CardValue;
  variantId: string | null;
};

export type VoteShowcase = {
  majority: ShowcaseVote;
  minimum: ShowcaseVote | null;
  maximum: ShowcaseVote | null;
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
  const ballots = players.filter(
    (p): p is PublicPlayer & { vote: CardValue } => !p.spectator && Boolean(p.vote),
  );
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
  const far = outliers.slice().sort((a, b) => SIZE_RANK[b.vote] - SIZE_RANK[a.vote])[0] ?? null;
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
    far,
    sized,
    specials,
  };
}

function toShowcaseVote(player: PublicPlayer | undefined): ShowcaseVote | null {
  if (!player?.vote) return null;
  return {
    playerId: player.id,
    playerName: player.name,
    value: player.vote,
    variantId: player.variantId,
  };
}

function pickPlayer(
  candidates: PublicPlayer[],
  usedPlayerIds: Set<string>,
): PublicPlayer | undefined {
  return candidates.find((player) => !usedPlayerIds.has(player.id)) ?? candidates[0];
}

/**
 * Selects the exact persisted character variants used by the reveal animation.
 * The selection is deterministic and prefers different voters when one estimate
 * is simultaneously the majority and an edge of the range.
 */
export function buildVoteShowcase(analysis: Consensus): VoteShowcase | null {
  const ballots = [...analysis.sized, ...analysis.specials];
  const majorityPlayer = ballots.find((player) => player.vote === analysis.mode);
  const majority = toShowcaseVote(majorityPlayer);
  if (!majority) return null;

  const usedPlayerIds = new Set([majority.playerId]);
  if (analysis.sized.length < 2) {
    return { majority, minimum: null, maximum: null };
  }

  const minimumValue = analysis.sized[0].vote;
  const maximumValue = analysis.sized[analysis.sized.length - 1].vote;
  const minimumPlayer = pickPlayer(
    analysis.sized.filter((player) => player.vote === minimumValue),
    usedPlayerIds,
  );
  if (minimumPlayer) usedPlayerIds.add(minimumPlayer.id);

  const maximumPlayer = pickPlayer(
    analysis.sized.filter((player) => player.vote === maximumValue).reverse(),
    usedPlayerIds,
  );

  return {
    majority,
    minimum: toShowcaseVote(minimumPlayer),
    maximum: toShowcaseVote(maximumPlayer),
  };
}
