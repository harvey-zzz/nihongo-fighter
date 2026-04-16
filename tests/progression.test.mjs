import test from "node:test";
import assert from "node:assert/strict";
import { calculateCharacterStats, recordBattleProgress } from "../src/lib/progression.js";

test("recordBattleProgress increments plays and wins per character", () => {
  const next = recordBattleProgress({}, "taka", true);
  assert.deepEqual(next.taka, { plays: 1, wins: 1 });

  const nextLoss = recordBattleProgress(next, "taka", false);
  assert.deepEqual(nextLoss.taka, { plays: 2, wins: 1 });
});

test("calculateCharacterStats grows gradually and respects caps", () => {
  const baseStats = { power: 68, speed: 78, spirit: 72 };
  const early = calculateCharacterStats(baseStats, { plays: 3, wins: 1 });
  assert.deepEqual(
    { power: early.power, speed: early.speed, spirit: early.spirit, total: early.total },
    { power: 70, speed: 79, spirit: 74, total: 74 },
  );

  const capped = calculateCharacterStats(baseStats, { plays: 999, wins: 999 });
  assert.deepEqual(
    { power: capped.power, speed: capped.speed, spirit: capped.spirit, total: capped.total },
    { power: 90, speed: 93, spirit: 96, total: 93 },
  );
});
