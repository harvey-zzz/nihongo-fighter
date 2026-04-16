import express from "express";
import { createServer as createViteServer } from "vite";
import { Client } from "@notionhq/client";
import dotenv from "dotenv";
import path from "path";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { buildVocabularyVerbDataset } from "./src/lib/vocab-bank.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const LOCAL_CHARACTER_IMAGES = {
  hikaru: "/characters/hikaru.jpg",
  raito: "/characters/raito.jpg",
  hana: "/characters/hana.jpg",
  minami: "/characters/minami.jpg",
  taka: "/characters/taka.jpg",
} as const;

const BASE_CHARACTER_STATS = {
  hikaru: { power: 74, speed: 69, spirit: 64 },
  raito: { power: 62, speed: 71, spirit: 76 },
  hana: { power: 71, speed: 63, spirit: 85 },
  minami: { power: 66, speed: 84, spirit: 74 },
  taka: { power: 68, speed: 78, spirit: 72 },
} as const;

const TRANSITIVITY_PAIRS = [
  {
    id: "1",
    dictionary_form: "食べる",
    reading: "たべる",
    verb_family: "ichidan",
    causative: "食べさせる",
    passive: "食べられる",
    causative_passive: "食べさせられる",
    intransitive: "食べる",
    transitive: "食べる",
    meaning: "吃",
  },
  {
    id: "2",
    dictionary_form: "飲む",
    reading: "のむ",
    verb_family: "godan",
    causative: "飲ませる",
    passive: "飲まれる",
    causative_passive: "飲ませられる",
    intransitive: "飲む",
    transitive: "飲む",
    negative_form: "飲まない",
    masu_form: "飲みます",
    te_form: "飲んで",
    ta_form: "飲んだ",
    potential_form: "飲める",
    conditional_form: "飲めば",
    imperative_form: "飲め",
    volitional_form: "飲もう",
    meaning: "喝",
  },
  {
    id: "3",
    dictionary_form: "行く",
    reading: "いく",
    verb_family: "godan",
    causative: "行かせる",
    passive: "行かれる",
    causative_passive: "行かせられる",
    intransitive: "行く",
    transitive: "行く",
    negative_form: "行かない",
    masu_form: "行きます",
    te_form: "行って",
    ta_form: "行った",
    potential_form: "行ける",
    conditional_form: "行けば",
    imperative_form: "行け",
    volitional_form: "行こう",
    meaning: "去",
  },
  {
    id: "4",
    dictionary_form: "来る",
    reading: "くる",
    verb_family: "irregular",
    causative: "来させる",
    passive: "来られる",
    causative_passive: "来させられる",
    intransitive: "来る",
    transitive: "来る",
    meaning: "來",
  },
  {
    id: "5",
    dictionary_form: "書く",
    reading: "かく",
    verb_family: "godan",
    causative: "書かせる",
    passive: "書かれる",
    causative_passive: "書かせられる",
    intransitive: "書く",
    transitive: "書く",
    negative_form: "書かない",
    masu_form: "書きます",
    te_form: "書いて",
    ta_form: "書いた",
    potential_form: "書ける",
    conditional_form: "書けば",
    imperative_form: "書け",
    volitional_form: "書こう",
    meaning: "寫",
  },
  {
    id: "6",
    dictionary_form: "読む",
    reading: "よむ",
    verb_family: "godan",
    causative: "読ませる",
    passive: "読まれる",
    causative_passive: "読ませられる",
    intransitive: "読む",
    transitive: "読む",
    negative_form: "読まない",
    masu_form: "読みます",
    te_form: "読んで",
    ta_form: "読んだ",
    potential_form: "読める",
    conditional_form: "読めば",
    imperative_form: "読め",
    volitional_form: "読もう",
    meaning: "讀",
  },
  {
    id: "7",
    dictionary_form: "開く",
    reading: "ひらく",
    verb_family: "godan",
    causative: "開かせる",
    passive: "開かれる",
    causative_passive: "開かせられる",
    intransitive: "開く",
    transitive: "開ける",
    negative_form: "開かない",
    masu_form: "開きます",
    te_form: "開いて",
    ta_form: "開いた",
    potential_form: "開ける",
    conditional_form: "開けば",
    imperative_form: "開け",
    volitional_form: "開こう",
    meaning: "打開",
  },
  {
    id: "8",
    dictionary_form: "閉める",
    reading: "しめる",
    verb_family: "ichidan",
    causative: "閉めさせる",
    passive: "閉められる",
    causative_passive: "閉めさせられる",
    intransitive: "閉まる",
    transitive: "閉める",
    meaning: "關閉",
  },
  {
    id: "9",
    dictionary_form: "消す",
    reading: "けす",
    verb_family: "godan",
    causative: "消させる",
    passive: "消される",
    causative_passive: "消させられる",
    intransitive: "消える",
    transitive: "消す",
    negative_form: "消さない",
    masu_form: "消します",
    te_form: "消して",
    ta_form: "消した",
    potential_form: "消せる",
    conditional_form: "消せば",
    imperative_form: "消せ",
    volitional_form: "消そう",
    meaning: "消除/關掉",
  },
  {
    id: "10",
    dictionary_form: "出す",
    reading: "だす",
    verb_family: "godan",
    causative: "出させる",
    passive: "出される",
    causative_passive: "出させられる",
    intransitive: "出る",
    transitive: "出す",
    negative_form: "出さない",
    masu_form: "出します",
    te_form: "出して",
    ta_form: "出した",
    potential_form: "出せる",
    conditional_form: "出せば",
    imperative_form: "出せ",
    volitional_form: "出そう",
    meaning: "拿出/出去",
  },
  {
    id: "11",
    dictionary_form: "待つ",
    reading: "まつ",
    verb_family: "godan",
    causative: "待たせる",
    passive: "待たれる",
    causative_passive: "待たせられる",
    intransitive: "待つ",
    transitive: "待つ",
    negative_form: "待たない",
    masu_form: "待ちます",
    te_form: "待って",
    ta_form: "待った",
    potential_form: "待てる",
    conditional_form: "待てば",
    imperative_form: "待て",
    volitional_form: "待とう",
    meaning: "等待",
  },
  {
    id: "12",
    dictionary_form: "話す",
    reading: "はなす",
    verb_family: "godan",
    causative: "話させる",
    passive: "話される",
    causative_passive: "話させられる",
    intransitive: "話す",
    transitive: "話す",
    negative_form: "話さない",
    masu_form: "話します",
    te_form: "話して",
    ta_form: "話した",
    potential_form: "話せる",
    conditional_form: "話せば",
    imperative_form: "話せ",
    volitional_form: "話そう",
    meaning: "說話",
  }
];

const VOCAB_BANK_PATH = path.join(__dirname, "data", "vocab_bank.json");
const VOCAB_BANK = JSON.parse(readFileSync(VOCAB_BANK_PATH, "utf8"));
const MOCK_VERBS = buildVocabularyVerbDataset(VOCAB_BANK, TRANSITIVITY_PAIRS);

const MOCK_CHARACTERS = [
  {
    id: "taka",
    name: "TAKA",
    specialty: "godan",
    image: LOCAL_CHARACTER_IMAGES.taka,
    description: "擅長五段動詞（ごだん）。從辞書形一路打到意向形，越後段越狠！",
    color: "#D97706",
    hexColor: "#D97706",
    baseStats: BASE_CHARACTER_STATS.taka,
  },
  {
    id: "hikaru",
    name: "HIKARU",
    specialty: "causative",
    image: LOCAL_CHARACTER_IMAGES.hikaru,
    description: "擅長使役形（させる）。粉色頭髮的戰士，讓別人做事的專家！",
    color: "#E63946",
    hexColor: "#E63946",
    baseStats: BASE_CHARACTER_STATS.hikaru,
  },
  {
    id: "raito",
    name: "RAITO",
    specialty: "passive",
    image: LOCAL_CHARACTER_IMAGES.raito,
    description: "擅長受身形（られる）。街機玩家出身，被動防禦技能點滿！",
    color: "#457B9D",
    hexColor: "#457B9D",
    baseStats: BASE_CHARACTER_STATS.raito,
  },
  {
    id: "hana",
    name: "HANA",
    specialty: "causative_passive",
    image: LOCAL_CHARACTER_IMAGES.hana,
    description: "擅長使役受身形（させられる）。被迫做事的究極苦主！",
    color: "#2A9D8F",
    hexColor: "#2A9D8F",
    baseStats: BASE_CHARACTER_STATS.hana,
  },
  {
    id: "minami",
    name: "MINAMI",
    specialty: "transitivity",
    image: LOCAL_CHARACTER_IMAGES.minami,
    description: "擅長自他動詞辨識。以瞬間判斷切開動作與狀態，是快節奏選擇戰的專家！",
    color: "#D946EF",
    hexColor: "#D946EF",
    baseStats: BASE_CHARACTER_STATS.minami,
  },
];

function normalizeCharacterRecords(characters: any[]) {
  // Return the mock characters directly — they are already correctly ordered and mapped.
  return characters.filter((c) => ["taka", "hikaru", "raito", "hana", "minami"].includes(c.id));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT || 3000);

  app.use(express.json());

  // Notion API Proxy for Verbs
  app.get("/api/verbs", async (req, res) => {
    try {
      const databaseId = "dc6d25c52fdc4df892cdbad5c018b66a";
      const apiKey = process.env.NOTION_API_KEY;
      const preferVocabularyBank = process.env.USE_NOTION_VERBS !== "true";

      if (preferVocabularyBank || !apiKey) {
        if (!apiKey) {
          console.warn("Notion API key missing, using vocabulary bank.");
        }
        return res.json(MOCK_VERBS);
      }

      const response = await (notion as any).databases.query({
        database_id: databaseId,
      });

      const verbs = response.results.map((page: any) => {
        const props = page.properties;
        return {
          id: page.id,
          dictionary_form: props["辭書形"]?.title?.[0]?.plain_text || "",
          verb_family:
            props["動詞類型"]?.select?.name?.toLowerCase?.() ||
            props["五段/一段/不規則"]?.select?.name?.toLowerCase?.() ||
            props["五段/一段/不規則"]?.rich_text?.[0]?.plain_text?.toLowerCase?.() ||
            "",
          causative: props["使役形"]?.rich_text?.[0]?.plain_text || "",
          passive: props["受身形"]?.rich_text?.[0]?.plain_text || "",
          causative_passive: props["使役受身形"]?.rich_text?.[0]?.plain_text || "",
          intransitive: props["自動詞"]?.rich_text?.[0]?.plain_text || props["辭書形"]?.title?.[0]?.plain_text || "",
          transitive: props["他動詞"]?.rich_text?.[0]?.plain_text || props["辭書形"]?.title?.[0]?.plain_text || "",
          negative_form: props["ない形"]?.rich_text?.[0]?.plain_text || "",
          masu_form: props["ます形"]?.rich_text?.[0]?.plain_text || "",
          te_form: props["て形"]?.rich_text?.[0]?.plain_text || "",
          ta_form: props["た形"]?.rich_text?.[0]?.plain_text || "",
          potential_form: props["可能形"]?.rich_text?.[0]?.plain_text || "",
          conditional_form: props["仮定形"]?.rich_text?.[0]?.plain_text || props["假定形"]?.rich_text?.[0]?.plain_text || "",
          imperative_form: props["命令形"]?.rich_text?.[0]?.plain_text || "",
          volitional_form: props["意向形"]?.rich_text?.[0]?.plain_text || "",
          meaning: props["中文意思"]?.rich_text?.[0]?.plain_text || "",
        };
      });

      res.json(verbs);
    } catch (error: any) {
      console.error("Notion Verbs Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Notion API Proxy for Characters
  app.get("/api/characters", async (req, res) => {
    try {
      const databaseId = "660e8c4fe41848bbaebaabf62bc26a9f";
      const apiKey = process.env.NOTION_API_KEY;

      if (!apiKey) {
        return res.json(normalizeCharacterRecords(MOCK_CHARACTERS));
      }

      const response = await (notion as any).databases.query({
        database_id: databaseId,
      });

      const characters = response.results.map((page: any) => {
        const props = page.properties;
        const name = props["角色名稱"]?.title?.[0]?.plain_text || "";
        const specialtyRaw = props["擅長類型"]?.multi_select?.[0]?.name || "";
        
        // Map specialty to our internal keys
        let specialty = "causative";
        if (specialtyRaw.includes("受身形") && !specialtyRaw.includes("使役")) specialty = "passive";
        if (specialtyRaw.includes("使役受身形")) specialty = "causative_passive";
        if (specialtyRaw.includes("自動詞") || specialtyRaw.includes("他動詞") || specialtyRaw.includes("自他動詞")) specialty = "transitivity";
        if (specialtyRaw.includes("五段")) specialty = "godan";

        const color = props["對應顏色主題"]?.rich_text?.[0]?.plain_text || "#E63946";

        // Map images to local assets so the game does not depend on external hosts.
        let image: string = LOCAL_CHARACTER_IMAGES.hikaru;
        const upperName = name.toUpperCase();
        if (upperName.includes("HIKARU")) image = LOCAL_CHARACTER_IMAGES.hikaru;
        if (upperName.includes("RAITO")) image = LOCAL_CHARACTER_IMAGES.raito;
        if (upperName.includes("HANA") || upperName.includes("KENTA")) image = LOCAL_CHARACTER_IMAGES.hana;
        if (upperName.includes("MINAMI")) image = LOCAL_CHARACTER_IMAGES.minami;
        if (upperName.includes("TAKA")) image = LOCAL_CHARACTER_IMAGES.taka;
        let baseStats: { power: number; speed: number; spirit: number } = BASE_CHARACTER_STATS.hikaru;
        if (upperName.includes("HIKARU")) baseStats = BASE_CHARACTER_STATS.hikaru;
        if (upperName.includes("RAITO")) baseStats = BASE_CHARACTER_STATS.raito;
        if (upperName.includes("HANA") || upperName.includes("KENTA")) baseStats = BASE_CHARACTER_STATS.hana;
        if (upperName.includes("MINAMI")) baseStats = BASE_CHARACTER_STATS.minami;
        if (upperName.includes("TAKA")) baseStats = BASE_CHARACTER_STATS.taka;

        return {
          id: page.id,
          name: name,
          specialty: specialty,
          image: image,
          description: props["背景故事"]?.rich_text?.[0]?.plain_text || "",
          color: `from-[${color}] to-black`, // Simplified color mapping
          hexColor: color,
          baseStats,
        };
      });

      res.json(normalizeCharacterRecords(characters));
    } catch (error: any) {
      console.error("Notion Characters Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const publicPath = path.join(process.cwd(), "public");
    // Serve public folder first (character images, etc.)
    app.use(express.static(publicPath));
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
