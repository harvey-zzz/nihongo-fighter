const BASE_TIME_LIMIT = 15;

const DIFFICULTY_BONUS = {
  easy: 0,
  medium: 3,
  hard: 5,
};

const SPECIALTY_RULES = {
  causative: { label: "使役形", difficulty: "easy", note: "標準變化，維持基本秒數" },
  passive: { label: "受身形", difficulty: "easy", note: "標準變化，維持基本秒數" },
  transitivity: { label: "自他動詞", difficulty: "medium", note: "需要在自動詞與他動詞之間快速判斷，額外加秒" },
  causative_passive: { label: "使役受身形", difficulty: "hard", note: "雙重變化最難，額外加較多秒數" },
  dictionary_form: { label: "辭書形", difficulty: "easy", note: "預設基本秒數" },
  godan: { label: "五段動詞", difficulty: "easy", note: "依活用分層決定秒數" },
};

const GODAN_QUESTION_RULES = [
  { answerKey: "dictionary_form", promptLabel: "辞書形", difficulty: "easy" },
  { answerKey: "masu_form", promptLabel: "ます形", difficulty: "easy" },
  { answerKey: "negative_form", promptLabel: "ない形", difficulty: "easy" },
  { answerKey: "te_form", promptLabel: "て形", difficulty: "medium" },
  { answerKey: "ta_form", promptLabel: "た形", difficulty: "medium" },
  { answerKey: "potential_form", promptLabel: "可能形", difficulty: "medium" },
  { answerKey: "conditional_form", promptLabel: "仮定形", difficulty: "hard" },
  { answerKey: "imperative_form", promptLabel: "命令形", difficulty: "hard" },
  { answerKey: "volitional_form", promptLabel: "意向形", difficulty: "hard" },
];

const IRREGULAR_FORMS = new Set(["する", "来る", "くる"]);
const JLPT_LEVELS = ["N5", "N4", "N3", "N2"];

function shuffleList(list) {
  const next = [...list];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function rotateUntilBoundarySeparated(list, blockedSourceVerbId) {
  if (list.length <= 1 || !blockedSourceVerbId) {
    return list;
  }

  const next = [...list];

  for (let index = 0; index < next.length; index += 1) {
    if (next[0]?.sourceVerbId !== blockedSourceVerbId) {
      break;
    }

    next.push(next.shift());
  }

  return next;
}

function getSpecialtyRule(specialty) {
  return SPECIALTY_RULES[specialty] ?? SPECIALTY_RULES.dictionary_form;
}

function getIrregularBonus(verb) {
  return IRREGULAR_FORMS.has(verb.dictionary_form) ? 2 : 0;
}

export function calculateQuestionTimeLimit(verb, specialty, difficultyOverride) {
  const difficulty = difficultyOverride ?? getSpecialtyRule(specialty).difficulty;
  return BASE_TIME_LIMIT + (DIFFICULTY_BONUS[difficulty] ?? 0) + getIrregularBonus(verb);
}

export function describeQuestionDifficulty(verb, specialty, difficultyOverride) {
  const specialtyRule = getSpecialtyRule(specialty);
  const difficulty = difficultyOverride ?? specialtyRule.difficulty;
  const irregularBonus = getIrregularBonus(verb);
  const bonus = DIFFICULTY_BONUS[difficulty] ?? 0;
  const parts = ["15 秒基礎"];

  if (bonus > 0) {
    parts.push(`+${bonus} 秒${difficulty === "medium" ? "中等題" : "困難題"}`);
  }

  if (irregularBonus > 0) {
    parts.push(`+${irregularBonus} 秒特殊動詞`);
  }

  return `${parts.join(" / ")} (${specialtyRule.note})`;
}

export function buildQuestionDeck(verbs, specialty) {
  if (specialty === "godan") {
    return verbs
      .filter((verb) => verb.verb_family === "godan")
      .flatMap((verb) =>
        GODAN_QUESTION_RULES.filter((rule) => Boolean(verb[rule.answerKey])).map((rule) => ({
          id: `${verb.id}-${rule.answerKey}`,
          sourceVerbId: verb.id,
          answerKey: rule.answerKey,
          answer: verb[rule.answerKey],
          questionType: "input",
          promptLabel: rule.promptLabel,
          difficulty: rule.difficulty,
          dictionary_form: verb.dictionary_form,
          meaning: verb.meaning,
          jlpt: verb.jlpt,
          timeLimit: calculateQuestionTimeLimit(verb, specialty, rule.difficulty),
          difficultyDescription: describeQuestionDifficulty(verb, specialty, rule.difficulty),
        })),
      );
  }

  if (specialty === "transitivity") {
    const transitivityPairs = verbs
      .filter((verb) => Boolean(verb.intransitive) && Boolean(verb.transitive) && verb.intransitive !== verb.transitive)
      .map((verb) => {
        const specialtyRule = getSpecialtyRule(specialty);
        return [
          {
            id: `${verb.id}-intransitive`,
            sourceVerbId: verb.id,
            answerKey: "intransitive",
            answer: "自動詞",
            questionType: "choice",
            promptLabel: "自動詞",
            difficulty: specialtyRule.difficulty,
            dictionary_form: verb.intransitive,
            meaning: verb.meaning,
            jlpt: verb.jlpt,
            options: ["自動詞", "他動詞"],
            relatedPair: [verb.intransitive, verb.transitive],
            timeLimit: calculateQuestionTimeLimit(verb, specialty, specialtyRule.difficulty),
            difficultyDescription: describeQuestionDifficulty(verb, specialty, specialtyRule.difficulty),
          },
          {
            id: `${verb.id}-transitive`,
            sourceVerbId: verb.id,
            answerKey: "transitive",
            answer: "他動詞",
            questionType: "choice",
            promptLabel: "他動詞",
            difficulty: specialtyRule.difficulty,
            dictionary_form: verb.transitive,
            meaning: verb.meaning,
            jlpt: verb.jlpt,
            options: ["自動詞", "他動詞"],
            relatedPair: [verb.intransitive, verb.transitive],
            timeLimit: calculateQuestionTimeLimit(verb, specialty, specialtyRule.difficulty),
            difficultyDescription: describeQuestionDifficulty(verb, specialty, specialtyRule.difficulty),
          },
        ];
      });

    const firstWave = shuffleList(
      transitivityPairs.map((pair) => pair[Math.floor(Math.random() * pair.length)]),
    );

    const secondWaveBase = firstWave.map((firstQuestion, index) => {
      const pair = transitivityPairs.find((candidatePair) => candidatePair[0].sourceVerbId === firstQuestion.sourceVerbId);
      return pair?.find((question) => question.id !== firstQuestion.id) ?? transitivityPairs[index]?.[0];
    });

    const secondWave = rotateUntilBoundarySeparated(
      transitivityPairs.map((pair, index) => {
        return secondWaveBase[index] ?? pair[0];
      }),
      firstWave.at(-1)?.sourceVerbId,
    );

    return [...firstWave, ...secondWave];
  }

  return verbs
    .filter((verb) => Boolean(verb[specialty]))
    .map((verb) => {
      const specialtyRule = getSpecialtyRule(specialty);
      return {
        id: `${verb.id}-${specialty}`,
        sourceVerbId: verb.id,
        answerKey: specialty,
        answer: verb[specialty],
        questionType: "input",
        promptLabel: specialtyRule.label,
        difficulty: specialtyRule.difficulty,
        dictionary_form: verb.dictionary_form,
        meaning: verb.meaning,
        jlpt: verb.jlpt,
        timeLimit: calculateQuestionTimeLimit(verb, specialty, specialtyRule.difficulty),
        difficultyDescription: describeQuestionDifficulty(verb, specialty, specialtyRule.difficulty),
      };
    });
}

export function selectJlptLevelsForDifficulty(aiAccuracy) {
  if (aiAccuracy < 0.45) return ["N5"];
  if (aiAccuracy < 0.6) return ["N5", "N4"];
  if (aiAccuracy < 0.75) return ["N4", "N3"];
  if (aiAccuracy < 0.9) return ["N3", "N2"];
  return ["N2"];
}

export function formatJlptBand(levels) {
  const validLevels = levels.filter((level) => JLPT_LEVELS.includes(level));

  if (validLevels.length === 0) {
    return "N5";
  }

  if (validLevels.length === 1) {
    return validLevels[0];
  }

  return `${validLevels[0]}-${validLevels.at(-1)}`;
}

export function pickBattleQuestion(verbs, specialty, aiAccuracy, usedQuestionIds = []) {
  const jlptLevels = selectJlptLevelsForDifficulty(aiAccuracy);
  const fullDeck = buildQuestionDeck(verbs, specialty);
  const filteredDeck = fullDeck.filter((question) => !question.jlpt || jlptLevels.includes(question.jlpt));
  const activeDeck = filteredDeck.length > 0 ? filteredDeck : fullDeck;
  const unseenDeck = activeDeck.filter((question) => !usedQuestionIds.includes(question.id));
  const pool = unseenDeck.length > 0 ? unseenDeck : activeDeck;

  if (pool.length === 0) {
    return null;
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

const TURN_RULES = {
  correct: {
    attacker: "player",
    target: "enemy",
    enemyDamage: 24,
    playerDamage: 0,
    scoreDelta: 120,
    outcome: "success",
    label: "漂亮命中！",
    description: "你抓到正確變化，先手重擊對手。",
  },
  wrong: {
    attacker: "enemy",
    target: "player",
    enemyDamage: 0,
    playerDamage: 14,
    scoreDelta: 0,
    outcome: "failure",
    label: "對手反擊！",
    description: "答案失誤，對手立刻抓住破綻。",
  },
  timeout: {
    attacker: "enemy",
    target: "player",
    enemyDamage: 0,
    playerDamage: 18,
    scoreDelta: 0,
    outcome: "failure",
    label: "時間到！",
    description: "猶豫太久，對手直接壓上來。",
  },
};

export function createTurnResolution({ answerState, playerHp, enemyHp, score }) {
  const rule = TURN_RULES[answerState] ?? TURN_RULES.wrong;
  const nextPlayerHp = Math.max(0, playerHp - rule.playerDamage);
  const nextEnemyHp = Math.max(0, enemyHp - rule.enemyDamage);
  const nextScore = score + rule.scoreDelta;

  return {
    ...rule,
    playerHp: nextPlayerHp,
    enemyHp: nextEnemyHp,
    score: nextScore,
    battleEnded: nextPlayerHp === 0 || nextEnemyHp === 0,
  };
}

export function createAIDuelResolution({
  playerAnswerState,
  aiCorrect,
  playerHp,
  enemyHp,
  score,
  responseTimeMs,
}) {
  const fastBonus = playerAnswerState === "correct" && responseTimeMs < 2000;

  if (playerAnswerState === "correct" && aiCorrect) {
    return {
      outcome: "neutral",
      label: "雙方命中！",
      description: "AI 跟上了你的節奏，這一回合互相牽制，雙方都沒有掉血。",
      attacker: "both",
      target: "none",
      playerHp,
      enemyHp,
      score: score + 60,
      battleEnded: false,
    };
  }

  if (playerAnswerState === "correct") {
    const enemyDamage = (fastBonus ? 20 : 15) + 5;
    const nextEnemyHp = Math.max(0, enemyHp - enemyDamage);
    return {
      outcome: "success",
      label: fastBonus ? "高速壓制！" : "抓到破綻！",
      description: aiCorrect
        ? "你成功搶到正解，雖然 AI 也答對，但你的節奏仍然拿到分數。"
        : "你答對而且 AI 失手，這一回合直接打穿對手的防線。",
      attacker: "player",
      target: "enemy",
      playerHp,
      enemyHp: nextEnemyHp,
      score: score + (fastBonus ? 150 : 120),
      battleEnded: nextEnemyHp === 0,
    };
  }

  const playerDamage = playerAnswerState === "timeout" ? 15 : 10;
  const nextPlayerHp = Math.max(0, playerHp - playerDamage);
  return {
    outcome: "failure",
    label: playerAnswerState === "timeout" ? "時間耗盡！" : "你的節奏被看穿了！",
    description: aiCorrect
      ? "AI 先一步完成判定，立刻抓住你的失誤反擊。"
      : "你這題失手了，AI 也不穩，但仍然是你先露出破綻。",
    attacker: "enemy",
    target: "player",
    playerHp: nextPlayerHp,
    enemyHp,
    score,
    battleEnded: nextPlayerHp === 0,
  };
}
