import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("server reads PORT from environment with a 3000 fallback", () => {
  const source = readFileSync(new URL("../server.ts", import.meta.url), "utf8");

  assert.match(source, /process\.env\.PORT/);
  assert.match(source, /3000/);
});
