import test from "node:test";
import assert from "node:assert/strict";
import {
  buildQuestionDeck,
  createTurnResolution,
  describeQuestionDifficulty,
} from "../src/lib/battle.js";

const godanVerb = {
  id: "g1",
  dictionary_form: "書く",
  meaning: "寫",
  verb_family: "godan",
  masu_form: "書きます",
  negative_form: "書かない",
  te_form: "書いて",
  ta_form: "書いた",
  potential_form: "書ける",
  conditional_form: "書けば",
  imperative_form: "書け",
  volitional_form: "書こう",
};

test("buildQuestionDeck creates layered timings for standard specialties and godan mode", () => {
  const standard = buildQuestionDeck([
    { id: "v1", dictionary_form: "開く", intransitive: "開く", transitive: "開ける", meaning: "打開" },
    { id: "v4", dictionary_form: "閉める", intransitive: "閉まる", transitive: "閉める", meaning: "關閉" },
    { id: "v2", dictionary_form: "来る", causative_passive: "来させられる", meaning: "來" },
  ], "transitivity");

  assert.equal(standard.length, 4);
  assert.ok(standard.every((question) => question.timeLimit === 18));
  assert.ok(standard.every((question) => question.difficulty === "medium"));
  assert.ok(standard.every((question) => question.questionType === "choice"));

  const akuQuestions = standard.filter((question) => question.sourceVerbId === "v1");
  assert.equal(akuQuestions.length, 2);
  assert.deepEqual(
    akuQuestions.map((question) => question.promptLabel).sort(),
    ["他動詞", "自動詞"],
  );
  assert.ok(akuQuestions.every((question) => JSON.stringify(question.options) === JSON.stringify(["自動詞", "他動詞"])));
  assert.ok(akuQuestions.every((question) => JSON.stringify(question.relatedPair) === JSON.stringify(["開く", "開ける"])));
  assert.ok(akuQuestions.some((question) => question.dictionary_form === "開く" && question.answer === "自動詞"));
  assert.ok(akuQuestions.some((question) => question.dictionary_form === "開ける" && question.answer === "他動詞"));
  for (let index = 1; index < standard.length; index += 1) {
    assert.notEqual(standard[index - 1].sourceVerbId, standard[index].sourceVerbId);
  }

  const hard = buildQuestionDeck([
    { id: "v3", dictionary_form: "来る", causative_passive: "来させられる", meaning: "來" },
  ], "causative_passive");
  assert.equal(hard[0].timeLimit, 22);
  assert.equal(hard[0].difficulty, "hard");
  assert.equal(hard[0].questionType, "input");

  const godan = buildQuestionDeck([godanVerb], "godan");
  assert.deepEqual(
    godan.map((question) => [question.answerKey, question.difficulty, question.timeLimit]),
    [
      ["dictionary_form", "easy", 15],
      ["masu_form", "easy", 15],
      ["negative_form", "easy", 15],
      ["te_form", "medium", 18],
      ["ta_form", "medium", 18],
      ["potential_form", "medium", 18],
      ["conditional_form", "hard", 20],
      ["imperative_form", "hard", 20],
      ["volitional_form", "hard", 20],
    ],
  );
  assert.ok(godan.every((question) => question.questionType === "input"));
});

test("describeQuestionDifficulty explains the time rule in a UI-friendly way", () => {
  assert.match(
    describeQuestionDifficulty({ dictionary_form: "閉める", transitive: "閉める", intransitive: "閉まる" }, "transitive", "medium"),
    /15 秒基礎/,
  );
  assert.match(
    describeQuestionDifficulty({ dictionary_form: "閉める", transitive: "閉める", intransitive: "閉まる" }, "transitive", "medium"),
    /\+3 秒/,
  );
  assert.match(
    describeQuestionDifficulty(godanVerb, "godan", "hard"),
    /困難題/,
  );
});

test("createTurnResolution handles correct answers, mistakes, and timeout counterattacks", () => {
  const correct = createTurnResolution({
    answerState: "correct",
    playerHp: 100,
    enemyHp: 100,
    score: 200,
  });
  assert.equal(correct.playerHp, 100);
  assert.equal(correct.enemyHp, 76);
  assert.equal(correct.score, 320);
  assert.equal(correct.attacker, "player");

  const wrong = createTurnResolution({
    answerState: "wrong",
    playerHp: 100,
    enemyHp: 100,
    score: 200,
  });
  assert.equal(wrong.playerHp, 86);
  assert.equal(wrong.enemyHp, 100);
  assert.equal(wrong.attacker, "enemy");
  assert.equal(wrong.outcome, "failure");

  const timeout = createTurnResolution({
    answerState: "timeout",
    playerHp: 18,
    enemyHp: 24,
    score: 200,
  });
  assert.equal(timeout.playerHp, 0);
  assert.equal(timeout.enemyHp, 24);
  assert.equal(timeout.outcome, "failure");
  assert.equal(timeout.battleEnded, true);
});
