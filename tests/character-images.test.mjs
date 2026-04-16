import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("character image sources use local public assets", () => {
  const serverSource = readFileSync(new URL("../server.ts", import.meta.url), "utf8");

  for (const name of ["hikaru", "raito", "kenta", "minami", "taka"]) {
    assert.match(
      serverSource,
      new RegExp(`${name}:\\s*"\\/characters\\/${name}\\.(jpg|png)"`, "i"),
    );
  }

  assert.match(serverSource, /name:\s*"MINAMI"/);
  assert.doesNotMatch(serverSource, /id:\s*"hana"/);
  assert.doesNotMatch(serverSource, /id:\s*"asa"/);
});
