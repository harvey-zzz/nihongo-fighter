const STORAGE_KEY = "nihongo-fighter-progress-v1";

export function getEmptyProgress() {
  return {};
}

export function getStoredProgress(storage = globalThis.localStorage) {
  if (!storage) return getEmptyProgress();

  try {
    const raw = storage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : getEmptyProgress();
  } catch {
    return getEmptyProgress();
  }
}

export function saveStoredProgress(progress, storage = globalThis.localStorage) {
  if (!storage) return;

  storage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

export function recordBattleProgress(progress, characterId, won) {
  const current = progress[characterId] ?? { plays: 0, wins: 0 };
  return {
    ...progress,
    [characterId]: {
      plays: current.plays + 1,
      wins: current.wins + (won ? 1 : 0),
    },
  };
}

export function calculateCharacterStats(baseStats, progressEntry) {
  const plays = progressEntry?.plays ?? 0;
  const wins = progressEntry?.wins ?? 0;
  const cappedPlays = Math.min(plays, 20);
  const cappedWins = Math.min(wins, 12);

  const power = Math.min(baseStats.power + Math.floor(cappedPlays / 2) + cappedWins, 99);
  const speed = Math.min(baseStats.speed + Math.floor(cappedPlays / 3) + Math.floor(cappedWins * 0.8), 99);
  const spirit = Math.min(baseStats.spirit + Math.floor(cappedPlays / 2) + Math.floor(cappedWins * 1.2), 99);

  return {
    power,
    speed,
    spirit,
    total: Math.min(Math.round((power + speed + spirit) / 3), 99),
    growth: {
      plays,
      wins,
    },
  };
}
