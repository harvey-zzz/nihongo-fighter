import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("production index.html does not reference source entrypoints", () => {
  const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");

  assert.equal(
    html.includes('/src/main.tsx'),
    false,
    "dist/index.html should not include a direct /src/main.tsx script tag",
  );
});
