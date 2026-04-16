export const AI_DEFAULT_CONFIG = {
  answerDelay: {
    min: 500,
    max: 6000,
    current: 3000,
  },
  accuracy: {
    min: 0.3,
    max: 0.95,
    current: 0.6,
  },
  trackingWindow: 5,
};

export function createInitialAIConfig() {
  return JSON.parse(JSON.stringify(AI_DEFAULT_CONFIG));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(values) {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function adaptAIDifficulty(config, playerRecentResults) {
  const recent = playerRecentResults.slice(-config.trackingWindow);
  const recentAccuracy = average(recent.map((entry) => (entry.answerState === "correct" ? 1 : 0)));
  const recentAvgTime = average(recent.map((entry) => entry.responseTimeMs));

  let nextDelay = config.answerDelay.current;
  let nextAccuracy = config.accuracy.current;

  if (recent.length > 0 && recentAccuracy >= 0.8 && recentAvgTime < 3000) {
    nextDelay = clamp(nextDelay - 300, config.answerDelay.min, config.answerDelay.max);
    nextAccuracy = clamp(nextAccuracy + 0.05, config.accuracy.min, config.accuracy.max);
  }

  if (recent.length > 0 && (recentAccuracy <= 0.4 || recentAvgTime > 5000)) {
    nextDelay = clamp(nextDelay + 300, config.answerDelay.min, config.answerDelay.max);
    nextAccuracy = clamp(nextAccuracy - 0.05, config.accuracy.min, config.accuracy.max);
  }

  return {
    ...config,
    answerDelay: {
      ...config.answerDelay,
      current: nextDelay,
    },
    accuracy: {
      ...config.accuracy,
      current: nextAccuracy,
    },
  };
}

export function generateWrongAnswer(question) {
  if (question.questionType === "choice") {
    return question.options?.find((option) => option !== question.answer) ?? "他動詞";
  }

  const mutations = [
    (value) => value.replace("ます", "まず"),
    (value) => value.slice(0, -1),
    (value) => value.replace("て", "で"),
    (value) => value.replace("ない", "な"),
    (value) => `${value}う`,
  ];

  for (const mutation of mutations) {
    const mutated = mutation(question.answer);
    if (mutated && mutated !== question.answer) {
      return mutated;
    }
  }

  return `${question.answer}x`;
}

export function planAIAttempt(question, config, randomValue = Math.random(), jitterSeed = Math.random()) {
  const jitter = Math.round((jitterSeed - 0.5) * 1000);
  const delayMs = clamp(
    config.answerDelay.current + jitter,
    config.answerDelay.min,
    config.answerDelay.max,
  );
  const isCorrect = randomValue < config.accuracy.current;

  return {
    status: "thinking",
    delayMs,
    remainingDelayMs: delayMs,
    isCorrect,
    submittedAnswer: isCorrect ? question.answer : generateWrongAnswer(question),
  };
}
