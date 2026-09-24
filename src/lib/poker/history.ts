import { SCALE, SIZE_RANK, type CardValue, type HistoryVote } from "./types.ts";

export type HistoryVoteGroup = {
  value: CardValue;
  names: string[];
};

export type HistoryVoteAnalysis = {
  totalVotes: number;
  consensusPct: number;
  mode: CardValue | null;
  median: string;
  range: string;
  groups: HistoryVoteGroup[];
  minimum: HistoryVoteGroup | null;
  maximum: HistoryVoteGroup | null;
  specialVotes: number;
};

function asCardValue(value: string): CardValue | null {
  return (SCALE as readonly string[]).includes(value) ? (value as CardValue) : null;
}

function rank(value: CardValue): number {
  return SIZE_RANK[value] ?? 99 + SCALE.indexOf(value);
}

export function analyzeHistoryVotes(votes: HistoryVote[]): HistoryVoteAnalysis {
  const ballots = votes.flatMap((vote) => {
    const value = asCardValue(vote.value);
    return value ? [{ ...vote, value }] : [];
  });
  const groups = SCALE.flatMap((value) => {
    const names = ballots.filter((vote) => vote.value === value).map((vote) => vote.name);
    return names.length ? [{ value, names }] : [];
  });
  const sized = ballots
    .filter((vote) => Boolean(SIZE_RANK[vote.value]))
    .slice()
    .sort((a, b) => rank(a.value) - rank(b.value));
  const source = sized.length ? sized : ballots;

  let mode: CardValue | null = null;
  let modeCount = 0;
  for (const group of groups.filter((group) =>
    sized.length ? Boolean(SIZE_RANK[group.value]) : true,
  )) {
    if (group.names.length > modeCount) {
      mode = group.value;
      modeCount = group.names.length;
    }
  }

  let median = "—";
  let range = "—";
  let minimum: HistoryVoteGroup | null = null;
  let maximum: HistoryVoteGroup | null = null;
  if (sized.length) {
    const left = sized[Math.floor((sized.length - 1) / 2)].value;
    const right = sized[Math.ceil((sized.length - 1) / 2)].value;
    median = left === right ? left : `${left}–${right}`;
    const minimumValue = sized[0].value;
    const maximumValue = sized[sized.length - 1].value;
    range = minimumValue === maximumValue ? minimumValue : `${minimumValue}–${maximumValue}`;
    minimum = groups.find((group) => group.value === minimumValue) ?? null;
    maximum = groups.find((group) => group.value === maximumValue) ?? null;
  }

  return {
    totalVotes: ballots.length,
    consensusPct: source.length ? Math.round((modeCount / source.length) * 100) : 0,
    mode,
    median,
    range,
    groups,
    minimum,
    maximum,
    specialVotes: ballots.filter((vote) => !SIZE_RANK[vote.value]).length,
  };
}
