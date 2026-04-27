import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { type BattleQuestion, type BattleResult, type BattleReviewItem, type Character, type Verb } from "./types";
import { cn } from "./lib/utils";
import { AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Clock3, Pause, Play, Sparkles, Swords, XCircle, CheckCircle2, Hourglass } from "lucide-react";
import confetti from "canvas-confetti";
import { buildQuestionDeck, createAIDuelResolution, formatJlptBand, selectJlptLevelsForDifficulty } from "./lib/battle.js";
import { adaptAIDifficulty, createInitialAIConfig, planAIAttempt } from "./lib/ai.js";
import { getBattlePresentation } from "./lib/battle-presentation.js";
import { calculateCharacterStats, getStoredProgress, recordBattleProgress, saveStoredProgress } from "./lib/progression.js";
import { getOrderedCharacters, shouldRunBattleTimer } from "./lib/ui-flow.js";
import { createLesson } from "./lib/lessons.js";
import { renderWithFuriganaJSX } from "./lib/furigana.jsx";
import { getCharacters, getVerbs } from "./lib/static-data.js";

// --- Components ---

const StartScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-[#03040e] px-4 py-10 sm:px-6">
    {/* Background radial glows */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_20%,rgba(0,245,255,0.18),transparent_55%),radial-gradient(ellipse_at_50%_80%,rgba(255,0,153,0.18),transparent_55%)]"></div>
    {/* CRT scanline overlay */}
    <div className="arcade-overlay"></div>

    {/* Top decorative line */}
    <div className="absolute inset-x-0 top-[14%] arcade-divider"></div>
    <div className="absolute inset-x-0 top-[15%] opacity-40 arcade-divider"></div>
    <div className="absolute inset-x-0 bottom-[14%] arcade-divider"></div>
    <div className="absolute inset-x-0 bottom-[15%] opacity-40 arcade-divider"></div>

    {/* Corner decorations */}
    <div className="absolute top-6 left-6 w-8 h-8 border-l-2 border-t-2 border-[#00f5ff] opacity-60"></div>
    <div className="absolute top-6 right-6 w-8 h-8 border-r-2 border-t-2 border-[#00f5ff] opacity-60"></div>
    <div className="absolute bottom-6 left-6 w-8 h-8 border-l-2 border-b-2 border-[#ff0099] opacity-60"></div>
    <div className="absolute bottom-6 right-6 w-8 h-8 border-r-2 border-b-2 border-[#ff0099] opacity-60"></div>

    <motion.div
      initial={{ scale: 0.85, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-5 px-2 sm:px-4"
    >
      {/* Sub-label above title */}
      <div className="arcade-chip max-w-full text-center text-[9px] sm:text-[10px] tracking-[0.32em] sm:tracking-[0.4em]">
        ★ JAPANESE VERB COMBAT ★
      </div>

      {/* Main title */}
      <div className="relative w-full flex flex-col items-center px-2">
        <h1
          className="arcade-title arcade-title-hero text-center w-full"
          style={{
            fontSize: "clamp(1.8rem, 7.5vw, 5.5rem)",
            color: "transparent",
            backgroundImage: "linear-gradient(180deg, #ffffff 0%, #00f5ff 45%, #ff0099 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            textShadow: "none",
            filter: "drop-shadow(0 0 10px rgba(0,245,255,0.34))",
            lineHeight: 1.25,
          }}
        >
          NIHONGO
        </h1>
        <h1
          className="arcade-title arcade-title-hero text-center w-full"
          style={{
            fontSize: "clamp(1.8rem, 7.5vw, 5.5rem)",
            color: "transparent",
            backgroundImage: "linear-gradient(180deg, #00f5ff 0%, #ffffff 50%, #ff0099 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            textShadow: "none",
            filter: "drop-shadow(0 0 10px rgba(255,0,153,0.34))",
            lineHeight: 1.25,
          }}
        >
          FIGHTER
        </h1>
      </div>

      {/* Japanese subtitle */}
      <p className="font-mono text-[11px] sm:text-sm tracking-[0.6em] uppercase text-center"
         style={{ color: "rgba(0,245,255,0.85)", textShadow: "0 0 12px rgba(0,245,255,0.6)" }}>
        日 語 格 鬥 家
      </p>

      {/* PRESS START button */}
      <motion.button
        animate={{
          boxShadow: [
            "0 0 20px rgba(0,245,255,0.3), 0 0 40px rgba(0,245,255,0.1)",
            "0 0 40px rgba(0,245,255,0.6), 0 0 80px rgba(0,245,255,0.2)",
            "0 0 20px rgba(0,245,255,0.3), 0 0 40px rgba(0,245,255,0.1)",
          ]
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.96 }}
        onClick={onStart}
        className="arcade-button mt-2 px-10 sm:px-14 py-4 sm:py-5 text-sm sm:text-base"
      >
        ▶ PRESS START ◀
      </motion.button>

      {/* INSERT COIN blinking */}
      <p className="arcade-coin-text mt-1">
        ★ INSERT COIN ★
      </p>
    </motion.div>

    {/* Bottom credit */}
    <div className="absolute bottom-8 font-mono text-[9px] uppercase tracking-[0.4em] text-center px-6"
         style={{ color: "rgba(255,0,153,0.5)" }}>
      © Harvey 2026 ／ ALL RIGHTS RESERVED
    </div>

    {/* Player count label (SF style) */}
    <div className="absolute top-8 left-1/2 -translate-x-1/2 font-mono text-[9px] tracking-[0.3em] uppercase"
         style={{ color: "rgba(255,230,0,0.6)" }}>
      1P / 2P GAME
    </div>
  </div>
);

const CharacterSelect = ({
  onSelect,
  onBack,
  progress,
}: {
  onSelect: (char: Character) => void;
  onBack: () => void;
  progress: Record<string, { plays: number; wins: number }>;
}) => {
  const [hoveredChar, setHoveredChar] = useState<Character | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getCharacters();
    const ordered = getOrderedCharacters(data);
    setCharacters(ordered);
    setHoveredChar(ordered[0] ?? null);
    setLoading(false);
  }, []);

  if (loading) return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="text-white font-mono animate-pulse">載入角色中...</div>
    </div>
  );

  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden overflow-y-auto lg:h-screen lg:overflow-hidden relative bg-[#03040e]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(0,245,255,0.15),transparent_50%),radial-gradient(ellipse_at_50%_100%,rgba(255,0,153,0.15),transparent_50%)]"></div>
      <div className="arcade-overlay"></div>
      {/* Header */}
      <div className="p-4 md:p-6 border-b flex flex-col justify-between gap-4 md:flex-row md:items-end relative z-10"
           style={{ borderColor: "rgba(0,245,255,0.2)" }}>
        <div>
          <motion.button
            whileHover={{ x: -3, scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={onBack}
            className="arcade-button mb-3 inline-flex items-center gap-2 px-4 py-2"
          >
            <ChevronLeft className="h-4 w-4" />
            BACK
          </motion.button>
          <div className="arcade-panel-heading mb-2">SELECT YOUR FIGHTER</div>
          <h2 className="arcade-title text-xl md:text-3xl text-white"
              style={{ textShadow: "0 0 20px rgba(0,245,255,0.4), 0 0 40px rgba(0,245,255,0.2)" }}>
            選擇角色
          </h2>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-xs font-mono text-gray-500 uppercase tracking-[0.35em]">Stage 01</p>
          <p className="text-xl font-black text-cyan-200 italic">動詞變化道場</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Character Grid */}
        <div className="w-full lg:w-1/2 p-4 md:p-8 lg:p-10 flex flex-col gap-4 overflow-y-auto min-h-0">
          {characters.map((char) => {
            const stats = calculateCharacterStats(char.baseStats, progress[char.id]);

            const isSelected = hoveredChar?.id === char.id;
            return (
            <motion.button
              key={char.id}
              whileHover={{ x: 6 }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => setHoveredChar(char)}
              onFocus={() => setHoveredChar(char)}
              onClick={() => onSelect(char)}
              className={cn(
                "arcade-portrait-frame relative w-full overflow-hidden group flex items-center transition-all duration-200",
                isSelected ? "arcade-portrait-selected" : ""
              )}
              style={{ minHeight: "5.5rem" }}
            >
              {/* Fighter portrait */}
              <div className="w-20 md:w-28 flex-shrink-0 self-stretch overflow-hidden bg-black"
                   style={{ borderRight: isSelected ? "2px solid rgba(255,230,0,0.6)" : "1px solid rgba(0,245,255,0.2)" }}>
                <img
                  src={char.image}
                  alt={char.name}
                  className={cn(
                    "w-full h-full object-cover [image-rendering:pixelated] transition-all duration-300",
                    isSelected ? "brightness-110 contrast-110" : "grayscale-[0.4] group-hover:grayscale-0 brightness-90 group-hover:brightness-105"
                  )}
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* Character info */}
              <div className="flex-1 px-4 md:px-5 text-left min-w-0 py-3">
                <div className={cn(
                  "arcade-title text-base md:text-xl truncate transition-all",
                  isSelected ? "text-[#ffe600]" : "text-white"
                )}
                style={isSelected ? { textShadow: "0 0 12px rgba(255,230,0,0.7)" } : {}}>
                  {char.name}
                </div>
                <div className="text-[9px] font-mono uppercase tracking-[0.38em] mt-1"
                     style={{ color: isSelected ? "#00f5ff" : "#ff0099", textShadow: isSelected ? "0 0 8px rgba(0,245,255,0.6)" : "0 0 8px rgba(255,0,153,0.4)" }}>
                  {char.specialty === "causative" ? "使役形" :
                   char.specialty === "passive" ? "受身形" :
                   char.specialty === "causative_passive" ? "使役受身形" :
                   char.specialty === "transitivity" ? "自他動詞" : "五段動詞"}
                </div>
                <div className="mt-2 flex items-center gap-3 text-[9px] font-mono uppercase tracking-[0.28em]"
                     style={{ color: "rgba(130,160,200,0.8)" }}>
                  <span style={{ color: "rgba(0,245,255,0.9)" }}>LV {stats.total}</span>
                  <span>★ {progress[char.id]?.wins ?? 0} WINS</span>
                </div>
              </div>

              <div className="px-3 md:px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ChevronRight style={{ color: isSelected ? "#ffe600" : "#00f5ff" }} className="w-5 h-5" />
              </div>

              {/* Selected glow overlay */}
              {isSelected && (
                <div className="absolute inset-0 pointer-events-none"
                     style={{ background: "linear-gradient(90deg, rgba(0,245,255,0.08), transparent 60%)" }} />
              )}
            </motion.button>
            );
          })}
        </div>

        {/* Preview Panel — hidden on mobile, shown md+ */}
        <div className="hidden md:block w-full lg:w-1/2 relative overflow-hidden border-t lg:border-t-0 lg:border-l min-h-[24rem] md:min-h-[30rem] lg:min-h-0"
             style={{ borderColor: "rgba(0,245,255,0.15)" }}>
          <AnimatePresence mode="wait">
            {hoveredChar && (() => {
              const stats = calculateCharacterStats(hoveredChar.baseStats, progress[hoveredChar.id]);

              return (
              <motion.div
                key={hoveredChar.id}
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -100, opacity: 0 }}
                className="absolute inset-0 flex flex-col"
              >
                <div 
                  className="absolute inset-0 opacity-20" 
                  style={{ background: hoveredChar.hexColor ? `linear-gradient(to bottom right, ${hoveredChar.hexColor}, black)` : undefined }}
                ></div>
                <img
                  src={hoveredChar.image}
                  alt={hoveredChar.name}
                  className="absolute right-0 bottom-0 h-full max-h-full w-full object-contain object-right-bottom grayscale-[0.5] contrast-125 [image-rendering:pixelated] p-4 md:p-6 lg:p-8"
                  referrerPolicy="no-referrer"
                />
                
                <div className="relative z-10 p-5 md:p-8 lg:p-12 flex flex-col h-full justify-between gap-6">
                  <div>
                    <div className="arcade-nameplate inline-flex max-w-[80%] md:max-w-[70%] flex-col gap-2 rounded-sm px-4 py-3 md:px-5 md:py-4">
                      <h3 className="arcade-title text-3xl md:text-5xl lg:text-6xl text-white">
                        {hoveredChar.name}
                      </h3>
                      <div className="text-[10px] font-mono uppercase tracking-[0.35em] text-cyan-200">
                        {getSpecialtyLabel(hoveredChar.specialty)}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 max-w-sm">
                    <div className="grid grid-cols-2 gap-5 md:gap-8">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-1">力量</p>
                        <div className="h-2 bg-white/10 w-full"><div className="h-full bg-white" style={{ width: `${stats.power}%` }}></div></div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-1">速度</p>
                        <div className="h-2 bg-white/10 w-full"><div className="h-full bg-white" style={{ width: `${stats.speed}%` }}></div></div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-1">能力值</p>
                        <div className="h-2 bg-white/10 w-full"><div className="h-full bg-cyan-300" style={{ width: `${stats.spirit}%` }}></div></div>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase mb-1">成長</p>
                        <div className="text-sm text-white font-black italic">{stats.total}</div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-[0.25em]">
                          {stats.growth.plays} Plays / {stats.growth.wins} Wins
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
              );
            })()}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const SPECIALTY_LABELS = {
  causative: "使役形",
  passive: "受身形",
  causative_passive: "使役受身形",
  transitivity: "自他動詞",
  dictionary_form: "辭書形",
  godan: "五段動詞",
} as const;

const getSpecialtyLabel = (specialty: Character["specialty"]) =>
  SPECIALTY_LABELS[specialty] ?? "辭書形";

const BattleStage = ({ character, onFinish, onBack }: { character: Character; onFinish: (result: BattleResult) => void; onBack?: () => void }) => {
  const [questions, setQuestions] = useState<BattleQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [playerHp, setPlayerHp] = useState(100);
  const [enemyHp, setEnemyHp] = useState(100);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [round, setRound] = useState(1);
  const [timeLeft, setTimeLeft] = useState(15);
  const [phase, setPhase] = useState<"ready" | "awaiting-ai" | "resolving" | "finished">("ready");
  const [isPaused, setIsPaused] = useState(false);
  const [turnFeedback, setTurnFeedback] = useState<null | {
    outcome: "success" | "failure";
    answerState: "correct" | "wrong" | "timeout";
    attacker: "player" | "enemy" | "both" | "none";
    target: "player" | "enemy" | "none";
    label: string;
    description: string;
    expected: string;
    submitted: string;
    promptLabel: string;
  }>(null);
  const [reviewItems, setReviewItems] = useState<BattleReviewItem[]>([]);
  const [aiConfig, setAiConfig] = useState(createInitialAIConfig());
  const [playerRecentResults, setPlayerRecentResults] = useState<{ answerState: "correct" | "wrong" | "timeout"; responseTimeMs: number }[]>([]);
  const [aiRoundState, setAiRoundState] = useState<null | {
    status: "thinking" | "answered";
    delayMs: number;
    remainingDelayMs: number;
    isCorrect: boolean;
    submittedAnswer: string;
  }>(null);
  const [loading, setLoading] = useState(true);
  const [questionNonce, setQuestionNonce] = useState(0);
  const reducedMotion = useReducedMotion();
  const advanceTimerRef = useRef<number | null>(null);
  const aiTimerRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const roundStartedAtRef = useRef(0);
  const playerAttemptRef = useRef<null | { answerState: "correct" | "wrong" | "timeout"; submittedAnswer: string; responseTimeMs: number }>(null);
  const aiRoundStateRef = useRef<null | {
    status: "thinking" | "answered";
    delayMs: number;
    remainingDelayMs: number;
    isCorrect: boolean;
    submittedAnswer: string;
  }>(null);
  const battlePresentation = getBattlePresentation(character.id);
  const enemyProfile = battlePresentation.enemy;

  useEffect(() => {
    const data = getVerbs() as Verb[];
    const deck = buildQuestionDeck(data, character.specialty);
    setQuestions(deck);
    setLoading(false);
  }, [character.specialty]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (phase !== "ready" && phase !== "awaiting-ai") return;
      setIsPaused((prev) => !prev);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) {
        window.clearTimeout(advanceTimerRef.current);
      }
      if (aiTimerRef.current) {
        window.clearTimeout(aiTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    aiRoundStateRef.current = aiRoundState;
  }, [aiRoundState]);

  const currentQuestion = questions[currentQuestionIndex];
  const isChoiceQuestion = currentQuestion?.questionType === "choice";
  const specialtyLabel = getSpecialtyLabel(character.specialty);
  const timeLimit = currentQuestion?.timeLimit ?? 15;
  const timeRule = currentQuestion?.difficultyDescription ?? "";
  const timerRatio = Math.max(0, Math.min(1, timeLeft / timeLimit));
  const timerDanger = timeLeft <= 5;
  const timerCritical = timeLeft <= 3;
  const correctCount = reviewItems.filter((item) => item.answerState === "correct").length;
  const wrongCount = reviewItems.filter((item) => item.answerState !== "correct").length;
  const useLightweightChoiceFeedback = currentQuestion?.questionType === "choice";
  const inputState =
    turnFeedback?.answerState === "correct" ? "success" :
    turnFeedback?.answerState === "wrong" ? "failure" :
    turnFeedback?.answerState === "timeout" ? "timeout" :
    "idle";

  useEffect(() => {
    if (!currentQuestion) return;
    playerAttemptRef.current = null;
    roundStartedAtRef.current = performance.now();
    const initialAIRound = planAIAttempt(currentQuestion, aiConfig);
    setTimeLeft(currentQuestion.timeLimit);
    setPhase("ready");
    setIsPaused(false);
    setTurnFeedback(null);
    setUserInput("");
    setAiRoundState(initialAIRound);
  }, [currentQuestionIndex, currentQuestion, questionNonce]);

  useEffect(() => {
    if (!shouldRunBattleTimer(phase, isPaused)) return;

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [phase, questionNonce, isPaused]);

  useEffect(() => {
    if (!aiRoundState || aiRoundState.status !== "thinking" || isPaused || phase === "finished" || phase === "resolving") {
      return;
    }

    if (aiTimerRef.current) {
      window.clearTimeout(aiTimerRef.current);
    }

    const plannedDelay = aiRoundState.remainingDelayMs;
    const scheduledAt = performance.now();

    aiTimerRef.current = window.setTimeout(() => {
      const answered = {
        ...aiRoundStateRef.current,
        status: "answered",
        remainingDelayMs: 0,
      };
      aiRoundStateRef.current = answered;
      setAiRoundState(answered);

      if (playerAttemptRef.current) {
        finalizeRound(playerAttemptRef.current, answered);
      }
    }, plannedDelay);

    return () => {
      const elapsed = performance.now() - scheduledAt;
      if (aiTimerRef.current) {
        window.clearTimeout(aiTimerRef.current);
      }

      if (aiRoundStateRef.current?.status === "thinking") {
        aiRoundStateRef.current = {
          ...aiRoundStateRef.current,
          remainingDelayMs: Math.max(0, plannedDelay - elapsed),
        };
        setAiRoundState(aiRoundStateRef.current);
      }
    };
  }, [aiRoundState?.status, aiRoundState?.remainingDelayMs, isPaused, phase, questionNonce]);

  useEffect(() => {
    if (!isPaused && phase === "ready" && timeLeft === 0 && currentQuestion) {
      commitPlayerAttempt("timeout", "", currentQuestion.timeLimit * 1000);
    }
  }, [timeLeft, phase, currentQuestion, isPaused]);

  useEffect(() => {
    if (!currentQuestion || currentQuestion.questionType !== "input" || phase !== "ready" || isPaused) {
      return;
    }

    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
      inputRef.current?.select();
    }, 40);

    return () => window.clearTimeout(focusTimer);
  }, [currentQuestionIndex, questionNonce, phase, isPaused, currentQuestion]);

  const queueNextRound = (nextScore: number, battleEnded: boolean, won: boolean, nextReviews: BattleReviewItem[]) => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
    }

    advanceTimerRef.current = window.setTimeout(() => {
      if (battleEnded || currentQuestionIndex >= questions.length - 1) {
        setPhase("finished");
        onFinish({
          score: nextScore,
          won,
          characterId: character.id,
          characterName: character.name,
          specialty: character.specialty,
          jlptBand: formatJlptBand(selectJlptLevelsForDifficulty(aiConfig.accuracy.current)),
          finalDifficulty: aiConfig.accuracy.current,
          correctCount: nextReviews.filter((item) => item.answerState === "correct").length,
          wrongCount: nextReviews.filter((item) => item.answerState === "wrong").length,
          timeoutCount: nextReviews.filter((item) => item.answerState === "timeout").length,
          reviews: nextReviews,
        });
        return;
      }

      setQuestionNonce((prev) => prev + 1);
      setRound((prev) => prev + 1);
      setCurrentQuestionIndex((prev) => prev + 1);
    }, reducedMotion ? 250 : 1450);
  };

  const finalizeRound = (
    playerAttempt: { answerState: "correct" | "wrong" | "timeout"; submittedAnswer: string; responseTimeMs: number },
    aiAttempt: NonNullable<typeof aiRoundState>,
  ) => {
    if (!currentQuestion || aiAttempt.status !== "answered") return;

    const resolution = createAIDuelResolution({
      playerAnswerState: playerAttempt.answerState,
      aiCorrect: aiAttempt.isCorrect,
      playerHp,
      enemyHp,
      score,
      responseTimeMs: playerAttempt.responseTimeMs,
    });

    const nextReviewItem: BattleReviewItem = {
      question: currentQuestion,
      submittedAnswer: playerAttempt.submittedAnswer || "未作答",
      answerState: playerAttempt.answerState,
      isCorrect: playerAttempt.answerState === "correct",
      lesson: createLesson(currentQuestion, playerAttempt.answerState),
    };
    const nextReviews = [...reviewItems, nextReviewItem];
    const nextRecentResults = [...playerRecentResults, { answerState: playerAttempt.answerState, responseTimeMs: playerAttempt.responseTimeMs }];
    const nextAIConfig = adaptAIDifficulty(aiConfig, nextRecentResults);

    setPhase("resolving");
    setPlayerHp(resolution.playerHp);
    setEnemyHp(resolution.enemyHp);
    setScore(resolution.score);
    setStreak(playerAttempt.answerState === "correct" ? streak + 1 : 0);
    setReviewItems(nextReviews);
    setPlayerRecentResults(nextRecentResults);
    setAiConfig(nextAIConfig);
    setTurnFeedback({
      outcome: resolution.outcome === "failure" ? "failure" : "success",
      answerState: playerAttempt.answerState,
      attacker: resolution.attacker,
      target: resolution.target,
      label: resolution.label,
      description: resolution.description,
      expected: currentQuestion.answer,
      submitted: playerAttempt.submittedAnswer || "未作答",
      promptLabel: currentQuestion.promptLabel,
    });

    if (playerAttempt.answerState === "correct") {
      confetti({
        particleCount: 60,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#22d3ee", "#ffffff"]
      });
    }

    queueNextRound(
      resolution.score,
      resolution.battleEnded,
      resolution.enemyHp === 0 || resolution.enemyHp < resolution.playerHp,
      nextReviews,
    );
  };

  const commitPlayerAttempt = (answerState: "correct" | "wrong" | "timeout", submittedAnswer: string, responseTimeMs: number) => {
    if (!currentQuestion || phase !== "ready") return;

    const attempt = { answerState, submittedAnswer, responseTimeMs };
    playerAttemptRef.current = attempt;

    if (aiRoundStateRef.current?.status === "answered") {
      finalizeRound(attempt, aiRoundStateRef.current);
      return;
    }

    setPhase("awaiting-ai");
    setTurnFeedback({
      outcome: answerState === "correct" ? "success" : "failure",
      answerState,
      attacker: "none",
      target: "none",
      label: "等待 AI 作答",
      description: "你的答案已送出，AI 正在完成這一回合的判定。",
      expected: currentQuestion.answer,
      submitted: submittedAnswer || "未作答",
      promptLabel: currentQuestion.promptLabel,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestion || phase !== "ready" || isPaused) return;

    const normalizedInput = userInput.trim();
    const normalizedExpected = currentQuestion.answer.trim();
    commitPlayerAttempt(
      normalizedInput === normalizedExpected ? "correct" : "wrong",
      normalizedInput,
      Math.round(performance.now() - roundStartedAtRef.current),
    );
  };

  const handleChoiceSelection = (option: string) => {
    if (!currentQuestion || currentQuestion.questionType !== "choice" || phase !== "ready" || isPaused) {
      return;
    }

    commitPlayerAttempt(
      option === currentQuestion.answer ? "correct" : "wrong",
      option,
      Math.round(performance.now() - roundStartedAtRef.current),
    );
  };

  if (loading || !currentQuestion) return (
    <div className="h-screen w-full bg-black flex items-center justify-center">
      <div className="text-white font-mono animate-pulse">載入關卡中...</div>
    </div>
  );

  return (
    <div className={cn("h-[100dvh] w-full flex flex-col relative overflow-hidden md:min-h-screen md:h-auto md:overflow-x-hidden md:overflow-y-auto xl:h-screen xl:overflow-hidden", battlePresentation.backdropClassName)}>
      <AnimatePresence>
        {isPaused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          >
            <div className="arcade-frame px-8 py-8 text-center">
              <div className="arcade-panel-heading mb-4">Paused</div>
              <div className="arcade-title text-2xl text-white mb-3">暫停中</div>
              <div className="text-sm text-gray-300">倒數與輸入已停止，按下按鈕或 `Esc` 即可繼續。</div>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                type="button"
                onClick={() => setIsPaused(false)}
                className="arcade-button mt-6 inline-flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-[0.28em]"
              >
                <Play className="h-4 w-4" />
                Resume Battle
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={cn("pointer-events-none absolute inset-0", battlePresentation.arenaGlowClassName)}></div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(0,0,0,0.28))]"></div>

      <div className="absolute right-4 top-4 z-30 md:right-6 md:top-6">
        <button
          type="button"
          onClick={() => setIsPaused((prev) => !prev)}
          disabled={phase === "finished" || phase === "resolving"}
          className="arcade-button px-4 py-2 text-xs uppercase tracking-[0.28em] shadow-[0_0_30px_rgba(5,8,18,0.55)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="flex items-center gap-2">
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            {isPaused ? "Resume" : "Pause"}
          </span>
        </button>
      </div>

      {/* ══ Mobile HP strip (hidden on md+) ══ */}
      <div className="md:hidden flex-shrink-0 px-3 pt-12 pb-1 z-20 flex flex-col gap-0.5">
        {/* Player row */}
        <div className="flex items-center gap-2">
          <img
            src={character.image} alt={character.name}
            className="w-8 h-8 flex-shrink-0 border border-cyan-400/70 object-cover [image-rendering:pixelated]"
            referrerPolicy="no-referrer"
          />
          <span className="text-white font-black text-[11px] uppercase truncate flex-shrink-0 w-[4.5rem]">{character.name}</span>
          <div className="flex-1 arcade-stat-bar h-2 overflow-hidden">
            <motion.div
              animate={{ width: `${playerHp}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              className="h-full arcade-hp-player"
            />
          </div>
          <span className="font-mono text-[10px] text-cyan-400 w-8 text-right flex-shrink-0">{playerHp}%</span>
        </div>
        {/* Timer compact row */}
        <div className="flex items-center justify-center gap-3 py-0.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Rd.{round}</span>
          <motion.span
            animate={timerDanger && !reducedMotion ? { scale: [1, 1.12, 1] } : { scale: 1 }}
            transition={timerDanger ? { repeat: Infinity, duration: timerCritical ? 0.55 : 0.9 } : { duration: 0.2 }}
            className={cn(
              "font-black text-sm leading-none flex items-center gap-1",
              timerCritical ? "text-red-400" : timerDanger ? "text-orange-300" : "text-white"
            )}
          >
            <Clock3 className="w-3 h-3" />{timeLeft}s
          </motion.span>
          <span className="text-[10px] font-mono text-emerald-300">✓{correctCount}</span>
          <span className="text-[10px] font-mono text-red-300">✗{wrongCount}</span>
        </div>
        {/* Enemy row */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-red-400 w-8 flex-shrink-0">{enemyHp}%</span>
          <div className="flex-1 arcade-stat-bar h-2 overflow-hidden">
            <motion.div
              animate={{ width: `${enemyHp}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 18 }}
              className="h-full arcade-hp-enemy"
            />
          </div>
          <span className="text-white font-black text-[11px] uppercase truncate flex-shrink-0 w-[4.5rem] text-right">{enemyProfile.name}</span>
          <img
            src={enemyProfile.image} alt={enemyProfile.name}
            className="w-8 h-8 flex-shrink-0 border border-red-500/70 object-cover [image-rendering:pixelated]"
            referrerPolicy="no-referrer"
          />
        </div>
      </div>

      {/* ══ Desktop HP bars (hidden on mobile, original 3-col layout) ══ */}
      <div className="hidden md:flex flex-shrink-0 p-6 pt-24 flex-row justify-between items-start z-20 gap-6">

        {/* ── Player HP ── */}
        <div className="arcade-frame w-1/3 flex items-start gap-4 p-3 md:p-4">
          <div className="w-16 h-16 border-2 border-cyan-400 overflow-hidden bg-black flex-shrink-0">
            <img src={character.image} alt={character.name} className="w-full h-full object-cover [image-rendering:pixelated]" referrerPolicy="no-referrer" />
          </div>
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-white font-black italic uppercase text-xl">{character.name}</span>
              <span className="text-cyan-400 font-mono text-sm">血量 {playerHp}%</span>
            </div>
            <div className="arcade-stat-bar h-4 overflow-hidden">
              <motion.div
                animate={{
                  width: `${playerHp}%`,
                  boxShadow: turnFeedback?.target === "player" ? "0 0 18px rgba(239,68,68,0.6)" : "0 0 18px rgba(34,211,238,0.45)",
                }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                className="h-full arcade-hp-player"
              ></motion.div>
            </div>
            <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em] text-cyan-300/80">
              {specialtyLabel} 專精
            </div>
          </div>
        </div>

        {/* ── Timer ── */}
        <motion.div
          animate={timerDanger && !reducedMotion ? { scale: [1, 1.05, 1] } : { scale: 1 }}
          transition={timerDanger ? { repeat: Infinity, duration: timerCritical ? 0.6 : 1 } : { duration: 0.2 }}
          className="flex flex-col items-center min-w-0 lg:min-w-52"
        >
          <div className={cn(
            "arcade-frame px-5 py-3 text-center",
            timerCritical ? "border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.35)]" :
            timerDanger ? "border-orange-400 shadow-[0_0_24px_rgba(251,146,60,0.28)]" :
            "border-cyan-300/20"
          )}>
            <div className="flex items-center justify-center gap-2 text-[11px] font-mono tracking-[0.35em] uppercase text-gray-400 mb-1">
              <Clock3 className="w-4 h-4" />
              本題倒數
            </div>
            <div className={cn(
              "text-5xl font-black italic leading-none",
              timerCritical ? "text-red-400" : timerDanger ? "text-orange-300" : "text-white"
            )}>{timeLeft}s</div>
          </div>
          <div className="arcade-stat-bar mt-3 h-2 w-full max-w-52 overflow-hidden">
            <motion.div
              animate={{ scaleX: timerRatio, backgroundColor: timerCritical ? "#ef4444" : timerDanger ? "#fb923c" : "#22d3ee" }}
              style={{ originX: 0 }}
              transition={{ duration: reducedMotion ? 0.15 : 0.35 }}
              className="h-full"
            />
          </div>
          <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">Round {round}</div>
          <div className="mt-2 flex items-center gap-4 text-[10px] font-mono uppercase tracking-[0.28em]">
            <span className="text-emerald-300">答對 {correctCount}</span>
            <span className="text-red-300">答錯 {wrongCount}</span>
          </div>
          <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">
            AI 準度 {Math.round(aiConfig.accuracy.current * 100)}% / 反應 {aiConfig.answerDelay.current}ms
          </div>
        </motion.div>

        {/* ── Enemy HP ── */}
        <div className="arcade-frame w-1/3 flex items-start gap-4 text-right p-3 md:p-4">
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span className="text-red-500 font-mono text-sm">血量 {enemyHp}%</span>
              <span className="text-white font-black italic uppercase text-xl">{enemyProfile.name}</span>
            </div>
            <div className="arcade-stat-bar h-4 flex justify-end overflow-hidden">
              <motion.div
                animate={{
                  width: `${enemyHp}%`,
                  boxShadow: turnFeedback?.target === "enemy" ? "0 0 18px rgba(34,211,238,0.55)" : "0 0 18px rgba(248,113,113,0.35)",
                }}
                transition={{ type: "spring", stiffness: 140, damping: 18 }}
                className="h-full arcade-hp-enemy"
              ></motion.div>
            </div>
            <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.3em] text-red-300/80">
              {enemyProfile.style}
            </div>
          </div>
          <div className="w-16 h-16 border-2 border-red-500 overflow-hidden bg-black flex-shrink-0">
            <img src={enemyProfile.image} alt={enemyProfile.name} className="w-full h-full object-cover [image-rendering:pixelated]" referrerPolicy="no-referrer" />
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto flex items-start xl:items-center justify-center relative pb-3 md:pb-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-500/20 via-transparent to-transparent pointer-events-none"></div>
        <div className="relative z-10 flex w-full justify-center px-3 py-2 md:px-6 xl:px-8">
          <div className="relative z-10 isolate flex flex-col items-center w-full max-w-3xl overflow-visible">
            <motion.div
              key={`${currentQuestion.id}-${questionNonce}`}
              initial={reducedMotion ? false : { scale: 0.94, opacity: 0, y: 16 }}
              animate={reducedMotion ? { opacity: 1 } : { scale: 1, opacity: 1, y: 0 }}
              exit={reducedMotion ? { opacity: 0 } : { scale: 1.04, opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className={cn(
                "arcade-frame relative z-10 w-full text-center",
                isChoiceQuestion ? "mb-3 p-3 sm:p-6 lg:p-7" : "mb-3 p-4 sm:p-8 lg:p-10"
              )}
            >
              {/* 答題回饋覆蓋層 — 疊在題目框上，版面完全不位移 */}
              <AnimatePresence initial={false}>
                {turnFeedback && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: useLightweightChoiceFeedback ? 0.18 : 0.25, ease: [0.22, 1, 0.36, 1] }}
                    className={cn(
                      "absolute inset-0 z-20 flex flex-col justify-center gap-3 px-4 md:px-5 py-4 will-change-transform",
                      turnFeedback.outcome === "success"
                        ? "bg-[linear-gradient(180deg,rgba(9,18,28,0.97),rgba(6,12,22,0.96))] border border-cyan-400/45"
                        : "bg-[linear-gradient(180deg,rgba(26,12,18,0.97),rgba(16,8,12,0.96))] border border-red-400/45"
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-1 text-left">
                        <div className="text-xs font-mono uppercase tracking-[0.35em] text-gray-400 mb-1">
                          {turnFeedback.attacker === "player" ? "玩家先手" : "對手反擊"}
                        </div>
                        <div className="text-xl md:text-2xl font-black italic text-white">{turnFeedback.label}</div>
                        <div className="mt-1 text-sm text-gray-300">{turnFeedback.description}</div>
                      </div>
                      {turnFeedback.outcome === "success" ? (
                        <Sparkles className="h-6 w-6 flex-shrink-0 text-cyan-300 mt-1" />
                      ) : (
                        <AlertTriangle className="h-6 w-6 flex-shrink-0 text-red-300 mt-1" />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="border border-white/10 bg-black/30 px-3 py-2 text-left">
                        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">你的答案</div>
                        <div className="mt-1 font-black text-white">{turnFeedback.submitted}</div>
                      </div>
                      <div className="border border-white/10 bg-black/30 px-3 py-2 text-left">
                        <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-gray-500">正確答案</div>
                        <div className="mt-1 font-black text-cyan-300">{turnFeedback.expected}</div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              {isChoiceQuestion ? (
                <div className="space-y-2 sm:space-y-5 text-left">
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.32em] text-cyan-400">題目指示</div>
                    <div className="mt-1 sm:mt-2 text-base sm:text-2xl font-black text-white">
                      從這組配對中選出 <span className="text-cyan-300">{currentQuestion.promptLabel}</span>
                    </div>
                  </div>
                  <div className="hidden sm:block text-sm sm:text-base leading-7 text-gray-400">
                    快速判斷哪個是符合題意的動詞，選錯或超時都會被反擊。
                  </div>
                  <div>
                    <div className="text-[11px] font-mono uppercase tracking-[0.32em] text-cyan-400">當前題目</div>
                    <h4 className="mt-2 font-black text-white break-all text-3xl sm:text-5xl lg:text-6xl xl:text-7xl text-center">
                      {currentQuestion.sourceVerbId && currentQuestion.sourceVerbId.toString().startsWith('bank-') ?
                        renderWithFuriganaJSX(currentQuestion.dictionary_form, currentQuestion.reading || "") :
                        currentQuestion.dictionary_form
                      }
                    </h4>
                    <p className="mt-1 sm:mt-3 text-center text-sm sm:text-xl lg:text-2xl text-gray-400 italic">{currentQuestion.meaning}</p>
                  </div>
                  <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-4 text-[11px] font-mono uppercase tracking-[0.28em] text-gray-500">
                    <div className="flex items-center gap-2">
                      <Swords className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>自他動詞辨識 / {currentQuestion.difficulty}</span>
                    </div>
                    <span className="hidden sm:inline">{timeRule}</span>
                  </div>
                  {/* 選擇按鈕 */}
                  <div className="grid grid-cols-2 gap-2 sm:gap-3 pt-0.5 sm:pt-1">
                    {currentQuestion.options?.map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => handleChoiceSelection(option)}
                        disabled={phase !== "ready" || isPaused}
                        className={cn(
                          "arcade-button w-full min-h-[42px] sm:min-h-[52px] border-2 px-3 py-2 text-center text-base sm:text-xl font-black tracking-[0.06em] text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45 focus:outline-none focus:ring-2 focus:ring-cyan-300/70",
                          inputState === "success" ? "border-cyan-300 bg-cyan-400/10 shadow-[0_0_28px_rgba(34,211,238,0.22)]" :
                          inputState === "failure" ? "border-red-500 bg-red-500/10 shadow-[0_0_28px_rgba(239,68,68,0.16)]" :
                          inputState === "timeout" ? "border-orange-400 bg-orange-400/10 shadow-[0_0_28px_rgba(251,146,60,0.16)]" :
                          "border-white/18 bg-white/[0.04] hover:-translate-y-1 hover:scale-[1.01] hover:border-cyan-300/80 hover:bg-cyan-400/10 active:scale-[0.98]"
                        )}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div className={cn("flex items-center justify-between gap-4", isChoiceQuestion ? "mb-3 sm:mb-4" : "mb-2 sm:mb-6")}>
                    <div className="text-[11px] sm:text-sm font-mono text-cyan-400 uppercase tracking-[0.3em]">當前動詞</div>
                    <div className="hidden sm:block text-[11px] font-mono text-gray-500 uppercase tracking-[0.25em] text-right">{timeRule}</div>
                  </div>
                  <h4 className={cn(
                    "font-black text-white break-all",
                    isChoiceQuestion ? "mb-3 text-3xl sm:text-5xl lg:text-6xl xl:text-7xl" : "mb-2 sm:mb-4 text-4xl sm:text-5xl lg:text-6xl xl:text-8xl"
                  )}>
                    {currentQuestion.sourceVerbId && currentQuestion.sourceVerbId.toString().startsWith('bank-') ?
                      renderWithFuriganaJSX(currentQuestion.dictionary_form, currentQuestion.reading || "") :
                      currentQuestion.dictionary_form
                    }
                  </h4>
                  <p className={cn("text-gray-400 italic", isChoiceQuestion ? "text-sm sm:text-xl" : "text-sm sm:text-xl lg:text-2xl")}>
                    {currentQuestion.meaning}
                  </p>
                  <div className={cn(
                    "flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono uppercase tracking-[0.3em] text-gray-500",
                    isChoiceQuestion ? "mt-2 sm:mt-4" : "mt-2 sm:mt-6"
                  )}>
                    <Swords className="w-4 h-4" />
                    目標變化：<span className="text-white">{currentQuestion.promptLabel}</span>
                    <span className="text-gray-600">/</span>
                    <span className="text-white">{currentQuestion.difficulty}</span>
                  </div>
                </>
              )}
            </motion.div>

            <div className="relative z-20 w-full">
              {currentQuestion.questionType !== "choice" && (
                <>
                  <div className="mb-2 sm:mb-3 flex flex-col gap-1 text-xs font-mono text-gray-500 uppercase tracking-widest sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                    <span>輸入作答</span>
                    <span className={cn(
                      "hidden sm:inline transition-colors",
                      timerCritical ? "text-red-400" : timerDanger ? "text-orange-300" : "text-gray-500"
                    )}>
                      {timerDanger ? "快作答，對手要壓上來了" : "答對就能先手壓制對手"}
                    </span>
                  </div>
                  <form onSubmit={handleSubmit}>
                  <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={phase !== "ready" || isPaused}
                    className={cn(
                      "w-full bg-white/10 border-2 p-3 sm:p-6 text-xl sm:text-4xl font-black text-white text-center transition-all duration-300 outline-none disabled:cursor-not-allowed",
                      inputState === "success" ? "border-cyan-300 bg-cyan-400/10 shadow-[0_0_35px_rgba(34,211,238,0.22)]" :
                      inputState === "failure" ? "border-red-500 bg-red-500/10 shadow-[0_0_35px_rgba(239,68,68,0.16)]" :
                      inputState === "timeout" ? "border-orange-400 bg-orange-400/10 shadow-[0_0_35px_rgba(251,146,60,0.16)]" :
                      "border-white/20 focus:border-cyan-400"
                    )}
                    placeholder="輸入變化..."
                  />
                </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

const ReviewSection = ({
  title,
  items,
  accentClass,
  icon,
}: {
  title: string;
  items: BattleReviewItem[];
  accentClass: string;
  icon: React.ReactNode;
}) => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (idx: number) => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.children[idx] as HTMLElement;
    if (!card) return;
    el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };

  const handleScroll = () => {
    const el = carouselRef.current;
    if (!el) return;
    const card = el.children[0] as HTMLElement;
    if (!card) return;
    const cardWidth = card.offsetWidth + 12; // gap-3 = 12px
    const idx = Math.round(el.scrollLeft / cardWidth);
    setActiveIndex(Math.min(Math.max(idx, 0), items.length - 1));
  };

  return (
  <section className="arcade-frame p-5 md:p-6">
    <div className="flex items-center justify-between gap-3 mb-4">
      <div className="flex items-center gap-3">
        <div className={cn("flex h-10 w-10 items-center justify-center rounded-full border flex-shrink-0", accentClass)}>{icon}</div>
        <div>
          <div className="arcade-panel-heading">{title}</div>
          <div className="text-sm text-gray-400">{items.length} 題</div>
        </div>
      </div>
      {/* Desktop arrow navigation */}
      {items.length > 1 && (
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => scrollToIndex(Math.max(activeIndex - 1, 0))}
            disabled={activeIndex === 0}
            className="arcade-button px-3 py-2 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
            {activeIndex + 1} / {items.length}
          </span>
          <button
            onClick={() => scrollToIndex(Math.min(activeIndex + 1, items.length - 1))}
            disabled={activeIndex === items.length - 1}
            className="arcade-button px-3 py-2 disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>

    {/* Carousel */}
    <div
      ref={carouselRef}
      className="results-carousel"
      onScroll={handleScroll}
    >
      {items.map((item) => (
        <article key={item.question.id} className="question-card border border-white/10 bg-black/30 p-4 md:p-5">
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">
            <span className="font-black text-white">
              {item.question.sourceVerbId && item.question.sourceVerbId.toString().startsWith('bank-') ?
                renderWithFuriganaJSX(item.question.dictionary_form, item.question.reading || "") :
                item.question.dictionary_form
              }
            </span>
            <span>/</span>
            <span>{item.question.promptLabel}</span>
            <span>/</span>
            <span>{item.answerState === "correct" ? "答對" : item.answerState === "timeout" ? "超時" : "答錯"}</span>
          </div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="border border-white/10 bg-black/25 px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">玩家答案</div>
              <div className="mt-1 font-black text-white">{item.submittedAnswer}</div>
            </div>
            <div className="border border-white/10 bg-black/25 px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">正確答案</div>
              <div className="mt-1 font-black text-cyan-300">{item.question.answer}</div>
            </div>
            <div className="border border-white/10 bg-black/25 px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">題型</div>
              <div className="mt-1 font-black text-white">{item.question.questionType === "choice" ? `辨識 ${item.question.promptLabel}` : item.question.promptLabel}</div>
            </div>
          </div>
          <div className="mt-4 border border-cyan-400/15 bg-cyan-400/5 p-4">
            <div className="flex items-center gap-2 text-cyan-300">
              <BookOpen className="h-4 w-4" />
              <div className="font-black">{item.lesson.headline}</div>
            </div>
            <p className="mt-2 text-sm leading-7 text-gray-200">{item.lesson.summary}</p>
            <p className="mt-3 text-sm leading-7 text-gray-300">{item.lesson.explanation}</p>
            {item.lesson.pitfall && (
              <p className="mt-3 text-sm leading-7 text-pink-100">
                <span className="font-black text-pink-300">老師提醒：</span>
                {item.lesson.pitfall}
              </p>
            )}
            <div className="mt-4 rounded-sm border border-white/10 bg-black/35 px-3 py-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">例句</div>
              <div className="mt-2 font-black text-white">{item.lesson.exampleJa}</div>
              <div className="mt-1 text-sm text-gray-400">{item.lesson.exampleZh}</div>
            </div>
          </div>
        </article>
      ))}
    </div>

    {/* Dot indicators */}
    {items.length > 1 && (
      <div className="flex justify-center gap-2 mt-4">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToIndex(i)}
            className={cn("carousel-dot", i === activeIndex ? "active" : "")}
            aria-label={`第 ${i + 1} 題`}
          />
        ))}
      </div>
    )}
  </section>
  );
};

const ResultScreen = ({
  result,
  onRestart,
  onSelect,
  onHome,
}: {
  result: BattleResult;
  onRestart: () => void;
  onSelect: () => void;
  onHome: () => void;
}) => {
  const reducedMotion = useReducedMotion();
  const correctItems = result.reviews.filter((item) => item.answerState === "correct");
  const wrongItems = result.reviews.filter((item) => item.answerState === "wrong");
  const timeoutItems = result.reviews.filter((item) => item.answerState === "timeout");

  return (
    <div className="min-h-screen w-full overflow-y-auto bg-[radial-gradient(circle_at_top,rgba(110,242,255,0.14),transparent_24%),radial-gradient(circle_at_bottom,rgba(255,79,216,0.14),transparent_22%),linear-gradient(180deg,rgba(4,6,16,0.98),rgba(4,4,10,1))] relative">
      <div className="arcade-overlay"></div>
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <section className="arcade-frame p-6 md:p-8">
          <div className="arcade-panel-heading mb-3">Battle Review</div>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <motion.h2
                initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="arcade-title arcade-title-review text-3xl md:text-5xl text-white"
              >
                {result.won ? "勝利複盤" : "戰後複習"}
              </motion.h2>
              <p className="mt-3 text-sm md:text-base text-gray-300 leading-7">
                這一頁不是只有結算，而是把你剛剛打過的內容整理成一輪小講義。先看整體表現，再逐題複習。
              </p>
            </div>
            <div className="text-left lg:text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.32em] text-gray-500">使用角色 / 模式</div>
              <div className="mt-2 text-xl font-black text-cyan-300">{result.characterName}</div>
              <div className="mt-1 text-sm text-gray-400">{getSpecialtyLabel(result.specialty)}</div>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="arcade-frame p-4 text-center"><div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">總分</div><div className="mt-2 text-3xl font-black text-cyan-300">{result.score}</div></div>
            <div className="arcade-frame p-4 text-center"><div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">結果</div><div className="mt-2 text-2xl font-black text-white">{result.won ? "WIN" : "LOSE"}</div></div>
            <div className="arcade-frame p-4 text-center"><div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">答對</div><div className="mt-2 text-3xl font-black text-emerald-300">{result.correctCount}</div></div>
            <div className="arcade-frame p-4 text-center"><div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">答錯</div><div className="mt-2 text-3xl font-black text-red-300">{result.wrongCount}</div></div>
            <div className="arcade-frame p-4 text-center"><div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">超時</div><div className="mt-2 text-3xl font-black text-orange-300">{result.timeoutCount}</div></div>
            <div className="arcade-frame p-4 text-center"><div className="text-[10px] font-mono uppercase tracking-[0.28em] text-gray-500">總題數</div><div className="mt-2 text-3xl font-black text-white">{result.reviews.length}</div></div>
          </div>
        </section>

        {correctItems.length > 0 && (
          <ReviewSection
            title="答對題組"
            items={correctItems}
            accentClass="border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
        )}

        {wrongItems.length > 0 && (
          <ReviewSection
            title="答錯題組"
            items={wrongItems}
            accentClass="border-red-400/50 bg-red-500/10 text-red-300"
            icon={<XCircle className="h-5 w-5" />}
          />
        )}

        {timeoutItems.length > 0 && (
          <ReviewSection
            title="超時題組"
            items={timeoutItems}
            accentClass="border-orange-400/50 bg-orange-500/10 text-orange-300"
            icon={<Hourglass className="h-5 w-5" />}
          />
        )}

        <section className="arcade-frame flex flex-col items-stretch justify-center gap-3 p-5 md:flex-row md:flex-wrap md:items-center md:gap-4 md:p-6">
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onRestart} className="arcade-button w-full px-8 py-3 font-black uppercase italic md:w-auto">
            再玩一次
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onSelect} className="arcade-button w-full px-8 py-3 font-black uppercase italic md:w-auto">
            回到角色選擇
          </motion.button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={onHome} className="arcade-button w-full px-8 py-3 font-black uppercase italic md:w-auto">
            回到主畫面
          </motion.button>
        </section>
      </div>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [gameState, setGameState] = useState<"start" | "select" | "battle" | "result">("start");
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [lastBattleResult, setLastBattleResult] = useState<BattleResult | null>(null);
  const [progress, setProgress] = useState<Record<string, { plays: number; wins: number }>>(() => getStoredProgress());

  const handleStart = () => setGameState("select");
  const handleBackToStart = () => setGameState("start");
  
  const handleSelectCharacter = (char: Character) => {
    setSelectedCharacter(char);
    setGameState("battle");
  };

  const handleFinishBattle = (result: BattleResult) => {
    setLastBattleResult(result);
    if (selectedCharacter) {
      const nextProgress = recordBattleProgress(progress, selectedCharacter.id, result.won);
      setProgress(nextProgress);
      saveStoredProgress(nextProgress);
    }
    setGameState("result");
  };

  const handleReplayBattle = () => {
    if (!selectedCharacter) {
      setGameState("select");
      return;
    }

    setGameState("battle");
  };

  const handleBackToSelect = () => {
    setGameState("select");
  };

  const handleRestart = () => {
    setGameState("start");
    setSelectedCharacter(null);
    setLastBattleResult(null);
  };

  return (
    <main className="min-h-screen bg-black text-white selection:bg-cyan-400 selection:text-black">
      <AnimatePresence mode="wait">
        {gameState === "start" && (
          <motion.div key="start" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <StartScreen onStart={handleStart} />
          </motion.div>
        )}
        {gameState === "select" && (
          <motion.div key="select" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <CharacterSelect onSelect={handleSelectCharacter} onBack={handleBackToStart} progress={progress} />
          </motion.div>
        )}
        {gameState === "battle" && selectedCharacter && (
          <motion.div key="battle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <BattleStage character={selectedCharacter} onFinish={handleFinishBattle} onBack={handleBackToSelect} />
          </motion.div>
        )}
        {gameState === "result" && lastBattleResult && (
          <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <ResultScreen
              result={lastBattleResult}
              onRestart={handleReplayBattle}
              onSelect={handleBackToSelect}
              onHome={handleRestart}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
