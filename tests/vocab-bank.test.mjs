import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildVocabularyVerbDataset } from "../src/lib/vocab-bank.js";

test("vocab_bank is available in-project and maps verb entries into battle-ready records", () => {
  const source = JSON.parse(
    readFileSync(new URL("../data/vocab_bank.json", import.meta.url), "utf8"),
  );

  assert.equal(source.length, 300);

  const mapped = buildVocabularyVerbDataset(source, []);
  const taberu = mapped.find((entry) => entry.dictionary_form === "食べる");
  const nomu = mapped.find((entry) => entry.dictionary_form === "飲む");

  assert.ok(mapped.length >= 160);
  assert.equal(taberu?.verb_family, "ichidan");
  assert.equal(taberu?.masu_form, "食べます");
  assert.equal(nomu?.verb_family, "godan");
  assert.equal(nomu?.te_form, "飲んで");
});
