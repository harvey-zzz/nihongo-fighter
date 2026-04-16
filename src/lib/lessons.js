const GODAN_RULE_NOTES = {
  dictionary_form: "辞書形就是動詞最原本的樣子，查字典和背單字時看到的就是這一形。",
  masu_form: "ます形要把五段動詞的尾音換到 i 段，再接上 ます。",
  negative_form: "ない形要把五段動詞的尾音換到 a 段，再接上 ない。",
  te_form: "て形要看音便規則，像 く 常變成 いて，む・ぶ・ぬ 常變成 んで。",
  ta_form: "た形可以把它想成て形的過去版，很多時候是把 て 換成 た。",
  potential_form: "可能形表示「能夠做」，五段動詞通常把尾音換到 e 段再接る。",
  conditional_form: "仮定形常用在『如果……的話』，五段動詞通常把尾音換到 e 段再接 ば。",
  imperative_form: "命令形語氣很強，五段動詞通常把尾音直接換到 e 段。",
  volitional_form: "意向形有『要來……吧』的感覺，五段動詞通常把尾音換到 o 段再接 う。",
};

function buildTransitivityLesson(question, answerState) {
  const isIntransitiveTarget = question.answerKey === "intransitive";
  const [intransitiveVerb, transitiveVerb] = question.relatedPair ?? [];
  const contrast = isIntransitiveTarget ? transitiveVerb : intransitiveVerb;

  return {
    headline: isIntransitiveTarget ? "自動詞判斷複習" : "他動詞判斷複習",
    summary:
      answerState === "correct"
        ? `這題抓得不錯，你有分出「${question.dictionary_form}」和「${contrast ?? "對應配對"}」的角色差異。`
        : `這題重點不只是背答案，而是要分清楚「事情自己發生」和「有人讓事情發生」。`,
    explanation:
      isIntransitiveTarget
        ? `這題的動詞是 ${question.dictionary_form}，正解是自動詞。因為它描述的是狀態自己發生，不特別強調施事者。像「門開了」這種場景，焦點在結果本身，所以會用自動詞。`
        : `這題的動詞是 ${question.dictionary_form}，正解是他動詞。因為它帶有施力者，表示有人主動對某個對象做了動作。像「把門打開」這種句子，重點在誰去做這個動作，所以會用他動詞。`,
    pitfall:
      answerState === "correct"
        ? `記憶時不要只背 ${question.dictionary_form}，最好把它和配對動詞 ${contrast ?? "另一個對應詞"} 一起記。`
        : `容易混淆的點是這兩個詞中文常都翻成「${question.meaning}」，但日文在句型上會分得更細。判斷時先問自己：這個句子是事情自然發生，還是有人主動去做？`,
    exampleJa: isIntransitiveTarget ? `${question.dictionary_form}。` : `私は${question.dictionary_form}。`,
    exampleZh: isIntransitiveTarget ? `這裡用 ${question.dictionary_form} 表示狀態自己發生。` : `這裡用 ${question.dictionary_form} 表示有人主動施加動作。`,
  };
}

function buildGodanLesson(question, answerState) {
  const note = GODAN_RULE_NOTES[question.answerKey] ?? "這一題屬於五段動詞活用，先辨認尾音，再套進對應規則。";

  return {
    headline: `${question.promptLabel} 複習`,
    summary:
      answerState === "correct"
        ? `這題你有抓到 ${question.dictionary_form} 的 ${question.promptLabel}，方向正確。`
        : `這題要先確認它是五段動詞，再依 ${question.promptLabel} 的規則去換尾音。`,
    explanation: `正確答案是 ${question.answer}。${note} 以 ${question.dictionary_form} 這題來說，先看最後一個假名，再決定要換到 a / i / e / o 段，或套用音便。`,
    pitfall:
      answerState === "correct"
        ? "五段動詞最怕只背單一答案，建議把同一個動詞的一整套活用一起複習。"
        : "常見錯誤是把五段動詞套成一段動詞規則，或是て形、た形沒有先判斷音便類型。",
    exampleJa: `${question.dictionary_form} -> ${question.answer}`,
    exampleZh: `把 ${question.dictionary_form} 變成 ${question.promptLabel} 時，答案是 ${question.answer}。`,
  };
}

function buildConjugationLesson(question, answerState) {
  const labelMap = {
    causative: "使役形",
    passive: "受身形",
    causative_passive: "使役受身形",
  };

  const modeLabel = labelMap[question.answerKey] ?? question.promptLabel;
  const modeNotes = {
    causative: "使役形有「讓某人做」的語感，重點是施事者讓另一方進行動作。",
    passive: "受身形有「被……」的語感，常用來表達被動承受某個動作。",
    causative_passive: "使役受身形是「被迫去做」，先有使役，再轉成被動，所以變化步驟最多。",
  };

  return {
    headline: `${modeLabel} 複習`,
    summary:
      answerState === "correct"
        ? `這題你成功把 ${question.dictionary_form} 轉成 ${modeLabel}。`
        : `這題要把 ${question.dictionary_form} 的尾音先換對，再接上 ${modeLabel} 的型。`,
    explanation: `正確答案是 ${question.answer}。${modeNotes[question.answerKey] ?? ""} 做題時可以先確認原動詞類型，再一步一步變化，不要一次整串硬背。`,
    pitfall:
      answerState === "correct"
        ? "你已經抓到主結構了，接下來可以多注意助詞和施事者位置。"
        : "常見混淆是把使役和被動的結尾混在一起，或少掉中間那一層變化。",
    exampleJa:
      question.answerKey === "causative"
        ? "先生は学生に本を読ませる。"
        : question.answerKey === "passive"
          ? "私は先生にほめられた。"
          : "私は先生に宿題をやらせられた。",
    exampleZh:
      question.answerKey === "causative"
        ? "老師讓學生讀書。"
        : question.answerKey === "passive"
          ? "我被老師稱讚了。"
          : "我被老師逼著做作業。",
  };
}

export function createLesson(question, answerState) {
  if (question.questionType === "choice") {
    return buildTransitivityLesson(question, answerState);
  }

  if (
    question.answerKey === "dictionary_form" ||
    question.answerKey === "masu_form" ||
    question.answerKey === "negative_form" ||
    question.answerKey === "te_form" ||
    question.answerKey === "ta_form" ||
    question.answerKey === "potential_form" ||
    question.answerKey === "conditional_form" ||
    question.answerKey === "imperative_form" ||
    question.answerKey === "volitional_form"
  ) {
    return buildGodanLesson(question, answerState);
  }

  return buildConjugationLesson(question, answerState);
}
