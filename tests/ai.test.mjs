import test from "node:test";
import assert from "node:assert/strict";
import {
  adaptAIDifficulty,
  createInitialAIConfig,
  generateWrongAnswer,
  planAIAttempt,
} from "../src/lib/ai.js";
import { createAIDuelResolution } from "../src/lib/battle.js";

test("AI planning creates deterministic thought delay and answers", () => {
  const config = createInitialAIConfig();
  const question = {
    questionType: "choice",
    answer: "自動詞",
    options: ["自動詞", "他動詞"],
  };

  const attempt = planAIAttempt(question, config, 0.2, 0.5);
  assert.equal(attempt.status, "thinking");
  assert.equal(attempt.isCorrect, true);
  assert.equal(attempt.submittedAnswer, "自動詞");
  assert.equal(attempt.delayMs, config.answerDelay.current);
});

test("AI generates plausible wrong answers for choice and input questions", () => {
  assert.equal(
    generateWrongAnswer({ questionType: "choice", answer: "自動詞", options: ["自動詞", "他動詞"] }),
    "他動詞",
  );
  assert.notEqual(
    generateWrongAnswer({ questionType: "input", answer: "食べます" }),
    "食べます",
  );
});

test("adaptive difficulty strengthens and softens the AI from recent player performance", () => {
  const config = createInitialAIConfig();

  const stronger = adaptAIDifficulty(config, [
    { answerState: "correct", responseTimeMs: 1800 },
    { answerState: "correct", responseTimeMs: 1900 },
    { answerState: "correct", responseTimeMs: 1700 },
    { answerState: "correct", responseTimeMs: 1500 },
    { answerState: "wrong", responseTimeMs: 2200 },
  ]);

  assert.ok(stronger.answerDelay.current < config.answerDelay.current);
  assert.ok(stronger.accuracy.current > config.accuracy.current);

  const softer = adaptAIDifficulty(config, [
    { answerState: "wrong", responseTimeMs: 6200 },
    { answerState: "timeout", responseTimeMs: 8000 },
    { answerState: "wrong", responseTimeMs: 5500 },
    { answerState: "correct", responseTimeMs: 6400 },
    { answerState: "wrong", responseTimeMs: 7100 },
  ]);

  assert.ok(softer.answerDelay.current > config.answerDelay.current);
  assert.ok(softer.accuracy.current < config.accuracy.current);
});

test("AI duel resolution handles ties, player wins, and player mistakes", () => {
  const tie = createAIDuelResolution({
    playerAnswerState: "correct",
    aiCorrect: true,
    playerHp: 100,
    enemyHp: 100,
    score: 0,
    responseTimeMs: 1400,
  });
  assert.equal(tie.enemyHp, 100);
  assert.equal(tie.playerHp, 100);
  assert.equal(tie.attacker, "both");

  const playerWin = createAIDuelResolution({
    playerAnswerState: "correct",
    aiCorrect: false,
    playerHp: 100,
    enemyHp: 100,
    score: 0,
    responseTimeMs: 1500,
  });
  assert.equal(playerWin.enemyHp, 75);
  assert.equal(playerWin.attacker, "player");

  const playerMistake = createAIDuelResolution({
    playerAnswerState: "wrong",
    aiCorrect: true,
    playerHp: 100,
    enemyHp: 100,
    score: 0,
    responseTimeMs: 3000,
  });
  assert.equal(playerMistake.playerHp, 90);
  assert.equal(playerMistake.attacker, "enemy");
});
