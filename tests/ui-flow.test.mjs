import test from "node:test";
import assert from "node:assert/strict";
import { getOrderedCharacters, shouldRunBattleTimer } from "../src/lib/ui-flow.js";

test("getOrderedCharacters places TAKA first and keeps others afterward", () => {
  const ordered = getOrderedCharacters([
    { id: "minami" },
    { id: "taka" },
    { id: "hikaru" },
    { id: "raito" },
  ]);

  assert.deepEqual(
    ordered.map((character) => character.id),
    ["taka", "minami", "hikaru", "raito"],
  );
});

test("shouldRunBattleTimer stops countdown while paused or not ready", () => {
  assert.equal(shouldRunBattleTimer("ready", false), true);
  assert.equal(shouldRunBattleTimer("ready", true), false);
  assert.equal(shouldRunBattleTimer("resolving", false), false);
});
