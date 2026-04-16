const STORAGE_KEY = "nihongo_fighter.analytics";

function getAnalyticsUrl() {
  return import.meta.env.VITE_ANALYTICS_URL?.trim() || "";
}

function getRuntimeState() {
  if (typeof window === "undefined") {
    return {
      sessionId: "",
      gameEnded: false,
      gameStartData: null,
      progress: {
        totalQuestions: 0,
        correctAnswers: 0,
        finalDifficulty: 0.6,
      },
    };
  }

  if (!window.__nihongoAnalyticsState) {
    window.__nihongoAnalyticsState = {
      sessionId: "",
      gameEnded: false,
      gameStartData: null,
      progress: {
        totalQuestions: 0,
        correctAnswers: 0,
        finalDifficulty: 0.6,
      },
    };
  }

  return window.__nihongoAnalyticsState;
}

function persistState(state) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function postAnalytics(payload, useBeacon = false) {
  const workerUrl = getAnalyticsUrl();

  if (!workerUrl) {
    return Promise.resolve(false);
  }

  if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([JSON.stringify(payload)], { type: "application/json" });
    navigator.sendBeacon(workerUrl, blob);
    return Promise.resolve(true);
  }

  return fetch(workerUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then(() => true)
    .catch(() => false);
}

export function generateSessionId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function startAnalyticsSession({ character, jlptLevel }) {
  const state = getRuntimeState();
  state.sessionId = generateSessionId();
  state.gameEnded = false;
  state.gameStartData = {
    character,
    jlptLevel,
    startTime: Date.now(),
  };
  state.progress = {
    totalQuestions: 0,
    correctAnswers: 0,
    finalDifficulty: 0.6,
  };
  persistState(state);
  return state.sessionId;
}

export function updateAnalyticsProgress({ totalQuestions, correctAnswers, finalDifficulty }) {
  const state = getRuntimeState();
  state.progress = {
    totalQuestions,
    correctAnswers,
    finalDifficulty,
  };
  persistState(state);
}

export async function finishAnalyticsSession({ result, totalQuestions, correctAnswers, finalDifficulty }) {
  const state = getRuntimeState();
  state.gameEnded = true;
  state.progress = {
    totalQuestions,
    correctAnswers,
    finalDifficulty,
  };
  persistState(state);

  await postAnalytics({
    sessionId: state.sessionId,
    character: state.gameStartData?.character,
    jlptLevel: state.gameStartData?.jlptLevel ?? "N5",
    result,
    totalQuestions,
    correctAnswers,
    finalDifficulty,
  });
}

export function installAnalyticsUnloadHandler() {
  if (typeof window === "undefined" || window.__nihongoAnalyticsUnloadInstalled) {
    return;
  }

  window.__nihongoAnalyticsUnloadInstalled = true;
  window.addEventListener("beforeunload", () => {
    const state = getRuntimeState();

    if (!state.sessionId || state.gameEnded || !state.gameStartData) {
      return;
    }

    postAnalytics(
      {
        sessionId: state.sessionId,
        character: state.gameStartData.character,
        jlptLevel: state.gameStartData.jlptLevel ?? "N5",
        result: "未完成",
        totalQuestions: state.progress.totalQuestions,
        correctAnswers: state.progress.correctAnswers,
        finalDifficulty: state.progress.finalDifficulty,
      },
      true,
    );
  });
}

export function resetAnalyticsSession() {
  const state = getRuntimeState();
  state.sessionId = "";
  state.gameEnded = false;
  state.gameStartData = null;
  state.progress = {
    totalQuestions: 0,
    correctAnswers: 0,
    finalDifficulty: 0.6,
  };
  persistState(state);
}

