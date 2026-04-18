import type { GameType } from "@prisma/client";

export type MotorCategory = "DECISION_CONTROL" | "REACTION_CONTROL";

export interface GameCatalogEntry {
  type: GameType;
  slug: string;
  title: string;
  category: MotorCategory;
}

export const TOTAL_SESSION_STEPS = 2;

export const GAME_CATALOG: Record<GameType, GameCatalogEntry> = {
  OCULAR: {
    type: "OCULAR",
    slug: "ocular",
    title: "Ocular Pursuit",
    category: "REACTION_CONTROL",
  },
  TIMER: {
    type: "TIMER",
    slug: "timer",
    title: "Timer Button",
    category: "REACTION_CONTROL",
  },
  MAZE: {
    type: "MAZE",
    slug: "maze",
    title: "Motor Control",
    category: "REACTION_CONTROL",
  },
  REVERSE_TYPE: {
    type: "REVERSE_TYPE",
    slug: "reverse-type",
    title: "Executive Function",
    category: "DECISION_CONTROL",
  },
  MEMORY: {
    type: "MEMORY",
    slug: "memory",
    title: "Spatial Memory",
    category: "DECISION_CONTROL",
  },
  REFLEX: {
    type: "REFLEX",
    slug: "reflex",
    title: "Reflex Tap",
    category: "REACTION_CONTROL",
  },
  SWIPE: {
    type: "SWIPE",
    slug: "swipe",
    title: "Decision Speed",
    category: "DECISION_CONTROL",
  },
  STROOP: {
    type: "STROOP",
    slug: "stroop",
    title: "Stroop Effect",
    category: "DECISION_CONTROL",
  },
};

const CATEGORY_ONE_GAMES: GameType[] = [
  "SWIPE",
  "STROOP",
  "MEMORY",
  "REVERSE_TYPE",
];
const CATEGORY_TWO_GAMES: GameType[] = [
  "REFLEX",
  "TIMER",
  "MAZE",
  "OCULAR",
];

function pickRandom<T>(items: readonly T[]): T {
  const index = Math.floor(Math.random() * items.length);
  return items[index];
}

function keyForPair(pair: { firstGame: GameType; secondGame: GameType }) {
  return `${pair.firstGame}:${pair.secondGame}`;
}

function pairPool(firstGames: readonly GameType[], secondGames: readonly GameType[]) {
  return firstGames.flatMap((firstGame) =>
    secondGames.map((secondGame) => ({ firstGame, secondGame })),
  );
}

export function pickSessionGames(
  history: Array<{
    firstGame: GameType | null;
    secondGame: GameType | null;
  }> = [],
) {
  const usedFirstGames = new Set(
    history.flatMap((session) => (session.firstGame ? [session.firstGame] : [])),
  );
  const usedSecondGames = new Set(
    history.flatMap((session) => (session.secondGame ? [session.secondGame] : [])),
  );
  const usedPairs = new Set(
    history.flatMap((session) =>
      session.firstGame && session.secondGame
        ? [keyForPair({ firstGame: session.firstGame, secondGame: session.secondGame })]
        : [],
    ),
  );

  const unusedFirstGames = CATEGORY_ONE_GAMES.filter((game) => !usedFirstGames.has(game));
  const unusedSecondGames = CATEGORY_TWO_GAMES.filter((game) => !usedSecondGames.has(game));

  const prioritizedPools = [
    pairPool(
      unusedFirstGames.length > 0 ? unusedFirstGames : CATEGORY_ONE_GAMES,
      unusedSecondGames.length > 0 ? unusedSecondGames : CATEGORY_TWO_GAMES,
    ),
    pairPool(
      unusedFirstGames.length > 0 ? unusedFirstGames : CATEGORY_ONE_GAMES,
      CATEGORY_TWO_GAMES,
    ),
    pairPool(
      CATEGORY_ONE_GAMES,
      unusedSecondGames.length > 0 ? unusedSecondGames : CATEGORY_TWO_GAMES,
    ),
    pairPool(CATEGORY_ONE_GAMES, CATEGORY_TWO_GAMES),
  ];

  for (const pool of prioritizedPools) {
    const freshPairs = pool.filter((pair) => !usedPairs.has(keyForPair(pair)));
    if (freshPairs.length > 0) {
      return pickRandom(freshPairs);
    }
  }

  return pickRandom(pairPool(CATEGORY_ONE_GAMES, CATEGORY_TWO_GAMES));
}

export function gamePath(sessionId: number, gameType: GameType): string {
  return `/session/${sessionId}/${GAME_CATALOG[gameType].slug}`;
}
