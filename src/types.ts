export type VerbConjugation =
  | "causative"
  | "passive"
  | "causative_passive"
  | "transitivity"
  | "dictionary_form"
  | "godan";

export type GodanAnswerKey =
  | "dictionary_form"
  | "negative_form"
  | "masu_form"
  | "te_form"
  | "ta_form"
  | "potential_form"
  | "conditional_form"
  | "imperative_form"
  | "volitional_form";

export type BattleAnswerKey =
  | "causative"
  | "passive"
  | "causative_passive"
  | "intransitive"
  | "transitive"
  | GodanAnswerKey;

export type BattleDifficulty = "easy" | "medium" | "hard";

export interface Verb {
  id: string;
  dictionary_form: string;
  reading?: string;
  jlpt?: "N5" | "N4" | "N3" | "N2";
  verb_family?: "godan" | "ichidan" | "irregular";
  causative: string;
  passive: string;
  causative_passive: string;
  intransitive: string;
  transitive: string;
  meaning: string;
  negative_form?: string;
  masu_form?: string;
  te_form?: string;
  ta_form?: string;
  potential_form?: string;
  conditional_form?: string;
  imperative_form?: string;
  volitional_form?: string;
}

export interface Character {
  id: string;
  name: string;
  specialty: VerbConjugation;
  image: string;
  description: string;
  color: string;
  hexColor?: string;
  baseStats: CharacterStats;
}

export interface CharacterStats {
  power: number;
  speed: number;
  spirit: number;
}

export interface BattleResult {
  score: number;
  won: boolean;
  characterId: string;
  characterName: string;
  specialty: VerbConjugation;
  jlptBand: string;
  finalDifficulty: number;
  correctCount: number;
  wrongCount: number;
  timeoutCount: number;
  reviews: BattleReviewItem[];
}

export interface BattleLesson {
  headline: string;
  summary: string;
  explanation: string;
  pitfall?: string;
  exampleJa: string;
  exampleZh: string;
}

export interface BattleReviewItem {
  question: BattleQuestion;
  submittedAnswer: string;
  answerState: "correct" | "wrong" | "timeout";
  isCorrect: boolean;
  lesson: BattleLesson;
}

export interface BattleQuestion {
  id: string;
  sourceVerbId: string;
  answerKey: BattleAnswerKey;
  answer: string;
  questionType: "input" | "choice";
  promptLabel: string;
  difficulty: BattleDifficulty;
  dictionary_form: string;
  reading?: string;
  meaning: string;
  jlpt?: "N5" | "N4" | "N3" | "N2";
  timeLimit: number;
  difficultyDescription: string;
  options?: string[];
  relatedPair?: string[];
}

export const CHARACTERS: Character[] = [
  {
    id: "hikaru",
    name: "Hikaru",
    specialty: "causative",
    image: "/characters/hikaru.jpg",
    description: "擅長使役形 (Causative)。讓別人做事的專家！",
    color: "from-pink-500 to-rose-600",
    baseStats: { power: 74, speed: 69, spirit: 64 },
  },
  {
    id: "raito",
    name: "Raito",
    specialty: "passive",
    image: "/characters/raito.png",
    description: "擅長受身形 (Passive)。被動技能點滿！",
    color: "from-blue-500 to-cyan-600",
    baseStats: { power: 62, speed: 71, spirit: 76 },
  },
  {
    id: "hana",
    name: "Hana",
    specialty: "causative_passive",
    image: "/characters/hana.jpg",
    description: "擅長使役受身形 (Causative-Passive)。藍髮護目鏡，被迫做事的究極苦主！",
    color: "from-emerald-500 to-teal-600",
    baseStats: { power: 71, speed: 63, spirit: 85 },
  },
  {
    id: "minami",
    name: "Minami",
    specialty: "transitivity",
    image: "/characters/minami.png",
    description: "擅長自他動詞辨識。用瞬間判斷切開動作與狀態！",
    color: "from-fuchsia-500 to-cyan-500",
    baseStats: { power: 66, speed: 84, spirit: 74 },
  },
  {
    id: "taka",
    name: "Taka",
    specialty: "godan",
    image: "/characters/taka.png",
    description: "擅長五段動詞。越後段越強，專打音便與活用節奏！",
    color: "from-red-500 to-orange-500",
    baseStats: { power: 68, speed: 78, spirit: 72 },
  },
];
