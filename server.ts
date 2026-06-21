import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Google Gemini Client (with User-Agent telemetry headers)
const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// Helper to normalized string (remove Alif lam, standardize Alif)
function cleanArabicWord(word: string): string {
  if (!word) return "";
  let cleaned = word.trim();
  // Remove "ال" prefix if word is longer than 3 characters (e.g., الأسد -> أسد, but بلد stays)
  if (cleaned.startsWith("ال") && cleaned.length > 3) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
}

function startsWithLetter(word: string, letter: string): boolean {
  const cleanedWord = cleanArabicWord(word);
  if (!cleanedWord) return false;

  const firstChar = cleanedWord.charAt(0);
  const normalizedLetter = letter.trim();

  // Normalize Alif variations
  const alifGroup = ["أ", "إ", "آ", "ا"];
  if (alifGroup.includes(normalizedLetter)) {
    return alifGroup.includes(firstChar);
  }

  // Normalize Taa Marbuta / Haa for end, but for start:
  // e.g. هـ vs ه
  if (normalizedLetter === "هـ" || normalizedLetter === "ه") {
    return firstChar === "هـ" || firstChar === "ه";
  }

  return firstChar === normalizedLetter;
}

// Fallback validation when Gemini is not configured
function getFallbackValidation(letter: string, answers: any) {
  const categories = ["boy", "girl", "animal", "plant", "inanimate", "country", "food"];
  const results: any = {};
  let totalScore = 0;

  const categoryLabels: any = {
    boy: "اسم الولد",
    girl: "اسم البنت",
    animal: "الحيوان",
    plant: "النبات",
    inanimate: "الجماد",
    country: "البلد",
    food: "الأكلة"
  };

  for (const cat of categories) {
    const val = (answers[cat] || "").trim();
    if (!val) {
      results[cat] = {
        valid: false,
        score: 0,
        feedback: "لم تقم بكتابة أي إجابة!"
      };
    } else if (startsWithLetter(val, letter)) {
      results[cat] = {
        valid: true,
        score: 10,
        feedback: `تبدو إجابة جيدة! تبدأ بحرف "${letter}". (فعّل مفتاح Gemini للتحقق اللغوي الذكي).`
      };
      totalScore += 10;
    } else {
      results[cat] = {
        valid: false,
        score: 0,
        feedback: `الحرف غير متطابق! الكلمة "${val}" لا تبدأ بحرف "${letter}".`
      };
    }
  }

  return {
    results,
    totalScore,
    overallVerdict: `انتهت الجولة بنجاح! حصلت على ${totalScore} من 70 درجة. (ملاحظة: يمكنك إعداد مفتاح GEMINI_API_KEY للحصول على تقييم فائق الذكاء وتصحيح تفاعلي بالذكاء الاصطناعي!)`
  };
}

// ----------------------------------------------------
// SECURE SERVER-SIDE GEMINI API ENDPOINTS
// ----------------------------------------------------

async function evaluateAnswers(letter: string, answers: any) {
  if (!ai) {
    console.log("Gemini API key is not set. Using local rule-based fallback...");
    return { fallback: true, ...getFallbackValidation(letter, answers) };
  }

  const categoriesFormatted = `
ولد: "${answers.boy || ''}"
بنت: "${answers.girl || ''}"
حيوان: "${answers.animal || ''}"
نبات: "${answers.plant || ''}"
جماد: "${answers.inanimate || ''}"
بلاد: "${answers.country || ''}"
أكلة: "${answers.food || ''}"
`;

  const prompt = `يرجى تقييم إجابات اللاعب لهذه الفئات لحرف "${letter}":
${categoriesFormatted}

قم بالتحقق مما يلي لكل فئة:
1. هل تبدأ الكلمة بحرف "${letter}"؟ (تغاضى عن "ال" التعريف الزائدة). الألف بجميع أشكالها (أ، إ، آ، ا) متطابقة وتُقبل.
2. هل تنتمي الكلمة حقيقةً للفئة (مثلاً الولد يجب أن يكون اسم ذكر، والبلاد دولة أو مدينة حقيقية، إلخ)؟ تفهم اللهجات والطبخات العربية والأسماء الدارجة.
3. قيّم كل فئة تالياً كدرجة من 10 (10 للصح التام، 5 للتسامح أو أخطاء إملائية طفيفة، 0 للخطأ أو الفارق الشاسع أو الإجابة الفارغة).`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `أنت حكم ذكي وخبير في لعبة الحروف العربية "جماد حيوان نبات" (Stop).
مهمتك تقييم الإجابات بناءً على الحرف العربي المعطى.
يجب إرجاع النتيجة بتنسيق JSON صارم وبطريقة الفئات المطابقة تماماً للمخطط التالي.
ملاحظات للمساعدة في التقييم والتعليق:
- ال التعريف في البداية تُتجاوز (مثلاً: "الأسد" لحرف "أ" صحيحة تماماً وتساوي 10 نقاط).
- التاء المربوطة والهاء في النهاية يُتسامح معهما.
- اكتب لكل فئة تعليقاً موجزاً وممتعاً باللغة العربية يشرح صحة الكلمة من عدمه.
- المجموع الإجمالي totalScore هو مجموع النقاط السبعة للمجموع الكامل العظمى (70 نقطة).
- اكتب تقييماً عاماً ملهماً للاعب في overallVerdict.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            results: {
              type: Type.OBJECT,
              properties: {
                boy: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["valid", "score", "feedback"]
                },
                girl: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["valid", "score", "feedback"]
                },
                animal: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["valid", "score", "feedback"]
                },
                plant: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["valid", "score", "feedback"]
                },
                inanimate: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["valid", "score", "feedback"]
                },
                country: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["valid", "score", "feedback"]
                },
                food: {
                  type: Type.OBJECT,
                  properties: {
                    valid: { type: Type.BOOLEAN },
                    score: { type: Type.INTEGER },
                    feedback: { type: Type.STRING }
                  },
                  required: ["valid", "score", "feedback"]
                }
              },
              required: ["boy", "girl", "animal", "plant", "inanimate", "country", "food"]
            },
            totalScore: { type: Type.INTEGER },
            overallVerdict: { type: Type.STRING }
          },
          required: ["results", "totalScore", "overallVerdict"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);
    return { fallback: false, ...parsedData };
  } catch (err) {
    console.error("Gemini validation service failed:", err);
    return { fallback: true, ...getFallbackValidation(letter, answers) };
  }
}

app.post("/api/validate", async (req, res) => {
  try {
    const { letter, answers } = req.body;
    if (!letter) {
      return res.status(400).json({ error: "Letter is required" });
    }
    const result = await evaluateAnswers(letter, answers);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Hardcoded fallback data for common Arabic letters
const FALLBACK_LETTERS_DATA: Record<string, { opponentAnswers: Record<string, string>; placeholders: Record<string, string> }> = {
  "أ": {
    opponentAnswers: { boy: "أحمد", girl: "أمل", animal: "أسد", plant: "أرز", inanimate: "إبريق", country: "ألمانيا", food: "أرز باللبن" },
    placeholders: { boy: "أحمد", girl: "أمل", animal: "أسد", plant: "أناناس", inanimate: "إبريق", country: "ألمانيا", food: "أرز" }
  },
  "ب": {
    opponentAnswers: { boy: "بدر", girl: "بسمة", animal: "بقرة", plant: "برتقال", inanimate: "باب", country: "بلجيكا", food: "بامية" },
    placeholders: { boy: "بشار", girl: "بثينة", animal: "بطة", plant: "بطاطس", inanimate: "برميل", country: "برازيل", food: "بشاميل" }
  },
  "ت": {
    opponentAnswers: { boy: "تامر", girl: "تهاني", animal: "تمساح", plant: "تفاح", inanimate: "تلفاز", country: "تركيا", food: "تمر" },
    placeholders: { boy: "تيسير", girl: "تقى", animal: "تيس", plant: "تمر", inanimate: "تاج", country: "تونس", food: "تبولة" }
  },
  "ج": {
    opponentAnswers: { boy: "جميل", girl: "جميلة", animal: "جمل", plant: "جزر", inanimate: "جدار", country: "جزائر", food: "جبنة" },
    placeholders: { boy: "جابر", girl: "جود", animal: "جراد", plant: "جوافة", inanimate: "جرس", country: "جورجيا", food: "جريش" }
  },
  "س": {
    opponentAnswers: { boy: "سامر", girl: "سعاد", animal: "سمكة", plant: "سبانخ", inanimate: "سرير", country: "سوريا", food: "سخينة" },
    placeholders: { boy: "سليم", girl: "سلوى", animal: "سنجاب", plant: "سمسم", inanimate: "ساعة", country: "سودان", food: "سلطة" }
  },
  "م": {
    opponentAnswers: { boy: "محمد", girl: "منى", animal: "ماعز", plant: "موز", inanimate: "مفتاح", country: "مصر", food: "ملوخية" },
    placeholders: { boy: "مازن", girl: "مريم", animal: "مهر", plant: "مشمش", inanimate: "منضدة", country: "مغرب", food: "مقلوبة" }
  }
};

function getLocalOpponentAndPlaceholders(letter: string, difficulty: string) {
  const normalizedLetter = letter.trim();
  const base = FALLBACK_LETTERS_DATA[normalizedLetter] || {
    opponentAnswers: {
      boy: normalizedLetter + "اسر",
      girl: normalizedLetter + "ادين",
      animal: normalizedLetter + "بشبش",
      plant: normalizedLetter + "تون",
      inanimate: normalizedLetter + "وح",
      country: "بلد تبدأ بـ " + normalizedLetter,
      food: "أكلة تبدأ بـ " + normalizedLetter
    },
    placeholders: {
      boy: "اسم ولد يبدأ بـ " + normalizedLetter,
      girl: "اسم بنت يبدأ بـ " + normalizedLetter,
      animal: "حيوان يبدأ بـ " + normalizedLetter,
      plant: "نبات يبدأ بـ " + normalizedLetter,
      inanimate: "جماد يبدأ بـ " + normalizedLetter,
      country: "بلد تبدأ بـ " + normalizedLetter,
      food: "أكلة تبدأ بـ " + normalizedLetter
    }
  };

  // Modify opponent answers according to difficulty
  const opponentAnswers = { ...base.opponentAnswers };
  const categories: Array<keyof typeof opponentAnswers> = ["boy", "girl", "animal", "plant", "inanimate", "country", "food"];

  if (difficulty === "easy") {
    // Keep only 3 random categories, empty the rest
    const shuffled = [...categories].sort(() => Math.random() - 0.5);
    shuffled.slice(3).forEach(cat => {
      opponentAnswers[cat] = "";
    });
  } else if (difficulty === "medium") {
    // Keep 5 categories
    const shuffled = [...categories].sort(() => Math.random() - 0.5);
    shuffled.slice(5).forEach(cat => {
      opponentAnswers[cat] = "";
    });
  }
  // Hard mode keeps all 7 categories filled!

  return {
    opponentAnswers,
    dynamicPlaceholders: base.placeholders
  };
}

// Complete endpoint to fetch opponent play and placeholders using Gemini
app.post("/api/opponent-and-placeholders", async (req, res) => {
  const { letter, difficulty } = req.body;
  if (!letter) {
    return res.status(400).json({ error: "Letter is required" });
  }

  const normalizedLetter = letter.trim();
  const diff = difficulty || "medium";

  if (!ai) {
    console.log("Gemini API key is not set. Using local prefilled setup...");
    return res.json({ fallback: true, ...getLocalOpponentAndPlaceholders(normalizedLetter, diff) });
  }

  try {
    const prompt = `أنت الخصم ومولد المساعدة في لعبة الحروف العربية "جماد حيوان نبات".
الحرف المختار لهذه الجولة هو: "${normalizedLetter}"
مستوى الصعوبة المطلوب للخصم هو: "${diff}"

المطلوب توليد شيئين في كائن JSON:
1. opponentAnswers: الإجابات التي سيكتبها الخصم الآلي بالتدريج.
- الفئات هي (boy, girl, animal, plant, inanimate, country, food).
- إذا كانت الصعوبة "easy": املأ 3 فئات فقط عشوائياً واترك الباقي فارغاً "". اجعل الكلمات بسيطة أو دارجة.
- إذا كانت الصعوبة "medium": املأ 5 فئات بكلمات عشوائية مناسبة ومتداولة، واترك الباقي فارغاً.
- إذا كانت الصعوبة "hard": املأ كافة الفئات السبع بكلمات سريعة وقوية وصحيحة تماماً ومبدعة تبدأ بحرف "${normalizedLetter}".

2. dynamicPlaceholders: أمثلة توضيحية لتبدأ بحرف "${normalizedLetter}" لكل فئة من الفئات السبعة تظهر للمستخدم لمساعدته أثناء كتابة الحل.
**هام جداً**: ضع الكلمة المقترحة مباشرة ككلمة واحدة فقط وبدون كتابة عبارات تمهيدية مثل "مثل: " أو "مثال: " أو "ولد: ". يجب أن يحتوي الحقل على الكلمة نفسها فقط!
مثال: إذا كان الحرف هو "ب":
- boy: "بدر"
- girl: "بسمة"
- animal: "بطة"
الخ.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `أنت خبير في لعبة جماد حيوان نبات العربية. يجب عليك إرجاع النتيجة بتنسيق JSON صارم تماماً ومطابق للمخطط المطلوب. تجنب إرجاع أي تعليق إضافي خارج ترميز JSON.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            opponentAnswers: {
              type: Type.OBJECT,
              properties: {
                boy: { type: Type.STRING },
                girl: { type: Type.STRING },
                animal: { type: Type.STRING },
                plant: { type: Type.STRING },
                inanimate: { type: Type.STRING },
                country: { type: Type.STRING },
                food: { type: Type.STRING }
              },
              required: ["boy", "girl", "animal", "plant", "inanimate", "country", "food"]
            },
            dynamicPlaceholders: {
              type: Type.OBJECT,
              properties: {
                boy: { type: Type.STRING },
                girl: { type: Type.STRING },
                animal: { type: Type.STRING },
                plant: { type: Type.STRING },
                inanimate: { type: Type.STRING },
                country: { type: Type.STRING },
                food: { type: Type.STRING }
              },
              required: ["boy", "girl", "animal", "plant", "inanimate", "country", "food"]
            }
          },
          required: ["opponentAnswers", "dynamicPlaceholders"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);
    res.json({ fallback: false, ...parsedData });

  } catch (err: any) {
    console.error("Error generating opponent state:", err);
    res.json({ fallback: true, ...getLocalOpponentAndPlaceholders(normalizedLetter, diff) });
  }
});

// Single Hint API endpoint using Gemini
app.post("/api/hint", async (req, res) => {
  const { letter, category } = req.body;
  if (!letter || !category) {
    return res.status(400).json({ error: "Letter and category are required" });
  }

  const categoryLabels: Record<string, string> = {
    boy: "اسم ولد 🧑",
    girl: "اسم بنت 👧",
    animal: "حيوان 🦁",
    plant: "نبات 🌳",
    inanimate: "جماد 🧱",
    country: "بلاد/مدن 🗺️",
    food: "أكلة/وجبة 🍲"
  };

  const label = categoryLabels[category] || category;

  if (!ai) {
    // Simple local fallback for hint
    const letterData = FALLBACK_LETTERS_DATA[letter];
    const localWord = letterData ? letterData.placeholders[category] : `${letter}.. كلمة مقترحة لـ ${label}`;
    return res.json({ fallback: true, hint: localWord });
  }

  try {
    const prompt = `أعطني كلمة واحدة حقيقية شائعة وممتعة في الثقافة العربية تبدأ بحرف "${letter}" وتندرج تحت التصنيف "${label}".
تجنب إضافة أي شرح أو مقدمات. أريد فقط الكلمة الصافية مع الرموز اللطيفة إذا رغبت. كود الإرجاع يجب أن يكون JSON مع حقل "hint".`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: `أنت مساعد معجمي لغوي عربي سريع. أجب فقط بصيغة JSON صارمة تحتوي على مفتاح "hint" وقيمته الكلمة المقترحة فقط.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            hint: { type: Type.STRING }
          },
          required: ["hint"]
        }
      }
    });

    const resultText = response.text || "{}";
    const parsedData = JSON.parse(resultText);
    res.json({ fallback: false, hint: parsedData.hint });

  } catch (err: any) {
    console.error("Hint API error:", err);
    const letterData = FALLBACK_LETTERS_DATA[letter];
    const localWord = letterData ? letterData.placeholders[category] : `${letter}..`;
    res.json({ fallback: true, hint: localWord });
  }
});

// ----------------------------------------------------
// REAL-TIME MULTIDEVICE MULTIPLAYER ENGINE (HTTP SYNC)
// ----------------------------------------------------

interface PlayerInRoom {
  id: 'p1' | 'p2';
  name: string;
  answers: Record<string, string>;
  isReady: boolean;
  hasSubmitted: boolean;
  score: number;
  results: any;
  overallVerdict: string;
}

interface MultiplayerRoom {
  code: string;
  letter: string;
  difficulty: string;
  durationSeconds: number;
  status: 'lobby' | 'playing' | 'grading' | 'results';
  timerStartedAt: number | null;
  p1: PlayerInRoom | null;
  p2: PlayerInRoom | null;
  whoTriggeredStop: string | null;
  lastUpdated: number;
}

const rooms: Record<string, MultiplayerRoom> = {};

// Clean up old rooms (inactive for more than 1 hour) every 10 minutes
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  for (const code of Object.keys(rooms)) {
    if (now - rooms[code].lastUpdated > ONE_HOUR) {
      console.log(`[MULTIPLAYER] Cleaning up stale room: ${code}`);
      delete rooms[code];
    }
  }
}, 10 * 60 * 1000);

// 1. Create Room (Player 1 is Host)
app.post("/api/multiplayer/create", (req, res) => {
  const { name, difficulty, durationSeconds } = req.body;
  const code = Math.floor(1000 + Math.random() * 9000).toString(); // 4-digit code
  
  const room: MultiplayerRoom = {
    code,
    letter: '',
    difficulty: difficulty || 'medium',
    durationSeconds: durationSeconds || 90,
    status: 'lobby',
    timerStartedAt: null,
    p1: {
      id: 'p1',
      name: name || 'اللاعب الأول',
      answers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
      isReady: true,
      hasSubmitted: false,
      score: 0,
      results: null,
      overallVerdict: ''
    },
    p2: null,
    whoTriggeredStop: null,
    lastUpdated: Date.now()
  };
  
  rooms[code] = room;
  console.log(`[MULTIPLAYER] Room created: ${code} by ${name}`);
  res.json({ success: true, room, playerId: 'p1' });
});

// 2. Join Room (Player 2)
app.post("/api/multiplayer/join", (req, res) => {
  const { code, name } = req.body;
  const room = rooms[code];
  
  if (!room) {
    return res.status(404).json({ error: "عذرًا، كود الغرفة غير صحيح أو انتهت صلاحيتها!" });
  }
  if (room.p2) {
    return res.status(400).json({ error: "عذرًا، الغرفة ممتلئة بالفعل بلاعبين!" });
  }

  room.p2 = {
    id: 'p2',
    name: name || 'اللاعب الثاني',
    answers: { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' },
    isReady: true,
    hasSubmitted: false,
    score: 0,
    results: null,
    overallVerdict: ''
  };

  room.lastUpdated = Date.now();
  console.log(`[MULTIPLAYER] Player joined: ${name} in room ${code}`);
  res.json({ success: true, room, playerId: 'p2' });
});

// 3. Get Room Sync Status (Polled by both devices)
app.get("/api/multiplayer/state", (req, res) => {
  const { code, playerId } = req.query;
  const room = rooms[code as string];
  
  if (!room) {
    return res.status(404).json({ error: "عذرًا، تم إغلاق الغرفة أو لم تعد متوفرة." });
  }

  room.lastUpdated = Date.now();

  // Deep clone to prevent direct mutations of general store and strip unsubmitted plays to avoid cheating
  const secureRoom: MultiplayerRoom = JSON.parse(JSON.stringify(room));
  if (room.status === 'playing') {
    if (playerId === 'p1' && secureRoom.p2) {
      secureRoom.p2.answers = { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' };
    } else if (playerId === 'p2' && secureRoom.p1) {
      secureRoom.p1.answers = { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' };
    }
  }

  res.json({ success: true, room: secureRoom });
});

// 4. Start Game (Triggered by Host)
app.post("/api/multiplayer/start", (req, res) => {
  const { code, letter, difficulty, durationSeconds } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: "الغرفة غير موجودة" });
  }

  room.letter = letter;
  room.difficulty = difficulty || room.difficulty;
  room.durationSeconds = durationSeconds || room.durationSeconds;
  room.status = 'playing';
  room.timerStartedAt = Date.now();
  room.whoTriggeredStop = null;

  if (room.p1) {
    room.p1.hasSubmitted = false;
    room.p1.results = null;
    room.p1.score = 0;
    room.p1.answers = { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' };
  }
  if (room.p2) {
    room.p2.hasSubmitted = false;
    room.p2.results = null;
    room.p2.score = 0;
    room.p2.answers = { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' };
  }

  room.lastUpdated = Date.now();
  console.log(`[MULTIPLAYER] Game started in room ${code} with letter ${letter}`);
  res.json({ success: true, room });
});

// 5. Submit Answers / Stop Trigger (Triggered by either player)
app.post("/api/multiplayer/submit", async (req, res) => {
  const { code, playerId, answers, isTriggerStop } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: "الغرفة غير متوفرة" });
  }

  const player = playerId === 'p1' ? room.p1 : room.p2;
  if (!player) {
    return res.status(404).json({ error: "اللاعب غير مسجل في هذه الغرفة" });
  }

  player.answers = answers;
  player.hasSubmitted = true;

  if (isTriggerStop && !room.whoTriggeredStop) {
    room.whoTriggeredStop = playerId;
    console.log(`[MULTIPLAYER] Player ${playerId} pressed STOP in room ${code}`);
  }

  const p1Submitted = room.p1 ? room.p1.hasSubmitted : true;
  const p2Submitted = room.p2 ? room.p2.hasSubmitted : true;

  // Grade immediately if BOTH submitted, or if someone triggered STOP and timer is finalized
  if (room.whoTriggeredStop || (p1Submitted && p2Submitted)) {
    room.status = 'grading';
    room.lastUpdated = Date.now();

    // Respond immediately to the client to update ui state to grading, then grade asynchronously
    res.json({ success: true, room });

    // Perform asynchronous grading
    try {
      const p1Answers = room.p1 ? room.p1.answers : {};
      const p2Answers = room.p2 ? room.p2.answers : {};

      const [p1Result, p2Result] = await Promise.all([
        room.p1 ? evaluateAnswers(room.letter, p1Answers) : Promise.resolve(null),
        room.p2 ? evaluateAnswers(room.letter, p2Answers) : Promise.resolve(null)
      ]);

      if (room.p1 && p1Result) {
        room.p1.results = p1Result.results;
        room.p1.score = p1Result.totalScore || 0;
        room.p1.overallVerdict = p1Result.overallVerdict || '';
      }
      if (room.p2 && p2Result) {
        room.p2.results = p2Result.results;
        room.p2.score = p2Result.totalScore || 0;
        room.p2.overallVerdict = p2Result.overallVerdict || '';
      }

      room.status = 'results';
      room.lastUpdated = Date.now();
      console.log(`[MULTIPLAYER] Grading completed for room ${code}. P1: ${room.p1?.score}, P2: ${room.p2?.score}`);
    } catch (err) {
      console.error("[MULTIPLAYER] Grading failed:", err);
      // Fallback grading on any error
      if (room.p1) {
        const fallbackVal = getFallbackValidation(room.letter, room.p1.answers);
        room.p1.results = fallbackVal.results;
        room.p1.score = fallbackVal.totalScore;
        room.p1.overallVerdict = fallbackVal.overallVerdict;
      }
      if (room.p2) {
        const fallbackVal = getFallbackValidation(room.letter, room.p2.answers);
        room.p2.results = fallbackVal.results;
        room.p2.score = fallbackVal.totalScore;
        room.p2.overallVerdict = fallbackVal.overallVerdict;
      }
      room.status = 'results';
      room.lastUpdated = Date.now();
    }
    return;
  }

  room.lastUpdated = Date.now();
  res.json({ success: true, room });
});

// 6. Play Again / Reset State
app.post("/api/multiplayer/restart", (req, res) => {
  const { code } = req.body;
  const room = rooms[code];

  if (!room) {
    return res.status(404).json({ error: "الغرفة غير موجودة" });
  }

  room.status = 'lobby';
  room.letter = '';
  room.timerStartedAt = null;
  room.whoTriggeredStop = null;

  if (room.p1) {
    room.p1.hasSubmitted = false;
    room.p1.results = null;
    room.p1.score = 0;
    room.p1.overallVerdict = '';
    room.p1.answers = { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' };
  }
  if (room.p2) {
    room.p2.hasSubmitted = false;
    room.p2.results = null;
    room.p2.score = 0;
    room.p2.overallVerdict = '';
    room.p2.answers = { boy: '', girl: '', animal: '', plant: '', inanimate: '', country: '', food: '' };
  }

  room.lastUpdated = Date.now();
  console.log(`[MULTIPLAYER] Room ${code} reset to lobby`);
  res.json({ success: true, room });
});

// ----------------------------------------------------
// WORKSPACE INTEGRATION ROUTING (VITE / STATIC SERVING)
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode with static files serving...");
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[BACKEND SERVER] Active at http://localhost:${PORT}`);
  });
}

startServer();
