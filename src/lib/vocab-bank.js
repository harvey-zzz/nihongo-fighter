const GROUP_TO_FAMILY = {
  g1: "godan",
  g2: "ichidan",
  g3_suru: "irregular",
  g3_kuru: "irregular",
};

function normalizeQuestionFormLabel(form) {
  const map = {
    "ます形": "masu_form",
    "て形": "te_form",
    "た形": "ta_form",
    "ない形": "negative_form",
    "可能形": "potential_form",
    "意向形": "volitional_form",
    "命令形": "imperative_form",
    "使役形": "causative",
    "受身形": "passive",
    "使役受身形": "causative_passive",
  };

  return map[form] ?? null;
}

export function mapVocabularyEntryToVerb(entry) {
  if (!entry || entry.type !== "verb") {
    return null;
  }

  const conjugations = entry.conjugations ?? {};
  const questionAnswers = (entry.questions ?? []).reduce((accumulator, question) => {
    const key = normalizeQuestionFormLabel(question.form);
    if (key && question.answer) {
      accumulator[key] = question.answer;
    }
    return accumulator;
  }, {});

  return {
    id: `bank-${entry.id}`,
    dictionary_form: entry.word,
    reading: entry.reading,
    jlpt: entry.jlpt,
    verb_family: GROUP_TO_FAMILY[entry.group] ?? "godan",
    meaning: entry.meaning,
    causative: conjugations["使役形"] ?? questionAnswers.causative ?? "",
    passive: conjugations["受身形"] ?? questionAnswers.passive ?? "",
    causative_passive: conjugations["使役受身形"] ?? questionAnswers.causative_passive ?? "",
    masu_form: conjugations["ます形"] ?? questionAnswers.masu_form ?? "",
    te_form: conjugations["て形"] ?? questionAnswers.te_form ?? "",
    ta_form: conjugations["た形"] ?? questionAnswers.ta_form ?? "",
    negative_form: conjugations["ない形"] ?? questionAnswers.negative_form ?? "",
    potential_form: conjugations["可能形"] ?? questionAnswers.potential_form ?? "",
    imperative_form: conjugations["命令形"] ?? questionAnswers.imperative_form ?? "",
    volitional_form: conjugations["意向形"] ?? questionAnswers.volitional_form ?? "",
    intransitive: "",
    transitive: "",
  };
}

export function buildVocabularyVerbDataset(entries, transitivityPairs = []) {
  const mappedVerbs = entries
    .map(mapVocabularyEntryToVerb)
    .filter(Boolean);

  return [...mappedVerbs, ...transitivityPairs];
}
