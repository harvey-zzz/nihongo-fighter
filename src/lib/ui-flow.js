const CHARACTER_PRIORITY = ["taka"];

export function getOrderedCharacters(characters) {
  return [...characters].sort((a, b) => {
    const aPriority = CHARACTER_PRIORITY.indexOf(a.id);
    const bPriority = CHARACTER_PRIORITY.indexOf(b.id);

    if (aPriority === -1 && bPriority === -1) return 0;
    if (aPriority === -1) return 1;
    if (bPriority === -1) return -1;
    return aPriority - bPriority;
  });
}

export function shouldRunBattleTimer(phase, isPaused) {
  return phase === "ready" && !isPaused;
}
