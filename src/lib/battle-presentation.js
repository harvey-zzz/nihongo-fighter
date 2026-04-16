const PRESENTATIONS = {
  hikaru: {
    enemy: { name: "TAKA", image: "/characters/taka.jpg", style: "高壓五段型" },
    stageKey: "neon-dojo",
    stageLabel: "霓光道場",
    backdropClassName:
      "bg-[radial-gradient(circle_at_18%_24%,rgba(244,114,182,0.26),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.18),transparent_24%),linear-gradient(180deg,rgba(18,18,24,0.98),rgba(6,6,10,1))]",
    arenaGlowClassName:
      "bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.22),transparent_52%)]",
  },
  raito: {
    enemy: { name: "HIKARU", image: "/characters/hikaru.jpg", style: "使役壓制型" },
    stageKey: "storm-lab",
    stageLabel: "雷雨研究室",
    backdropClassName:
      "bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.22),transparent_24%),radial-gradient(circle_at_74%_22%,rgba(125,211,252,0.16),transparent_22%),linear-gradient(180deg,rgba(10,16,28,0.98),rgba(4,8,16,1))]",
    arenaGlowClassName:
      "bg-[radial-gradient(circle_at_center,rgba(96,165,250,0.18),transparent_54%)]",
  },
  kenta: {
    enemy: { name: "RAITO", image: "/characters/raito.jpg", style: "反制鏡面型" },
    stageKey: "sealed-court",
    stageLabel: "封印中庭",
    backdropClassName:
      "bg-[radial-gradient(circle_at_22%_20%,rgba(16,185,129,0.2),transparent_26%),radial-gradient(circle_at_78%_18%,rgba(20,184,166,0.16),transparent_22%),linear-gradient(180deg,rgba(9,18,18,0.98),rgba(4,10,10,1))]",
    arenaGlowClassName:
      "bg-[radial-gradient(circle_at_center,rgba(45,212,191,0.18),transparent_52%)]",
  },
  minami: {
    enemy: { name: "TAKA", image: "/characters/taka.jpg", style: "極速判斷型" },
    stageKey: "shibuya-cross",
    stageLabel: "霓虹十字路口",
    backdropClassName:
      "bg-[radial-gradient(circle_at_18%_20%,rgba(217,70,239,0.2),transparent_26%),radial-gradient(circle_at_82%_18%,rgba(34,211,238,0.18),transparent_22%),linear-gradient(180deg,rgba(18,10,24,0.98),rgba(6,4,10,1))]",
    arenaGlowClassName:
      "bg-[radial-gradient(circle_at_center,rgba(217,70,239,0.18),transparent_52%)]",
  },
  taka: {
    enemy: { name: "HANA", image: "/characters/hana.jpg", style: "雙重活用型" },
    stageKey: "elevated-rail",
    stageLabel: "高架終點站",
    backdropClassName:
      "bg-[radial-gradient(circle_at_22%_16%,rgba(239,68,68,0.22),transparent_24%),radial-gradient(circle_at_80%_20%,rgba(251,146,60,0.16),transparent_22%),linear-gradient(180deg,rgba(28,10,8,0.98),rgba(10,4,4,1))]",
    arenaGlowClassName:
      "bg-[radial-gradient(circle_at_center,rgba(248,113,113,0.2),transparent_50%)]",
  },
};

export function getBattlePresentation(characterId) {
  return PRESENTATIONS[characterId] ?? PRESENTATIONS.hikaru;
}
