import test from "node:test";
import assert from "node:assert/strict";
import { getBattlePresentation } from "../src/lib/battle-presentation.js";

test("every playable character gets a unique enemy and stage treatment", () => {
  const hikaru = getBattlePresentation("hikaru");
  const raito = getBattlePresentation("raito");
  const kenta = getBattlePresentation("kenta");
  const minami = getBattlePresentation("minami");
  const taka = getBattlePresentation("taka");

  assert.equal(hikaru.enemy.name, "TAKA");
  assert.equal(raito.enemy.name, "HIKARU");
  assert.equal(kenta.enemy.name, "RAITO");
  assert.equal(minami.enemy.name, "TAKA");
  assert.equal(taka.enemy.name, "KENTA");

  const backgrounds = new Set([
    hikaru.stageKey,
    raito.stageKey,
    kenta.stageKey,
    minami.stageKey,
    taka.stageKey,
  ]);

  assert.equal(backgrounds.size, 5);
  assert.match(minami.stageLabel, /霓虹/);
  assert.match(taka.stageLabel, /高架/);
});
