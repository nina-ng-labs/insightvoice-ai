import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import express from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { AssemblyAI } from "assemblyai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.join(__dirname, "../.env"),
});

const groqApiKey = process.env.GROQ_API_KEY;
const geminiApiKey = process.env.GEMINI_API_KEY;

const assemblyaiApiKey = process.env.ASSEMBLYAI_API_KEY;

if (!assemblyaiApiKey) {
  console.error("❌ ASSEMBLYAI_API_KEY not found");
  process.exit(1);
}

const assemblyai = new AssemblyAI({
  apiKey: assemblyaiApiKey,
});

console.log("✅ AssemblyAI API key loaded");

if (!groqApiKey) {
  console.error("❌ GROQ_API_KEY not found");
  process.exit(1);
}

console.log("✅ Groq API key loaded");

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Store uploaded audio temporarily in memory
const upload = multer({
  storage: multer.memoryStorage(),
});

// --------------------------------------------------
// CORS — allow Expo Web to call the local API
// --------------------------------------------------
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  res.header(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

// ---------------------------------------
// Health check
// ---------------------------------------
app.get("/", (req, res) => {
  res.json({
    message: "Expense Tracker API is running",
  });
});

// ---------------------------------------
// VOICE:
// Audio -> AssemblyAI -> Transcript
// ---------------------------------------
app.use((req, res, next) => {
  console.log(
    `📡 ${req.method} ${req.url} | ${req.headers["content-type"] || "no-content-type"}`
  );
  next();
});

app.post(
  "/transcribe",
  upload.single("audio"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        error: "Audio file is required",
      });
    }

    try {
      console.log(
        `🎤 Audio received: ${req.file.originalname}`
      );

      console.log(
        `🎧 Audio size: ${req.file.size} bytes`
      );

      console.log(
        "🚀 Sending audio to AssemblyAI..."
      );

      const transcript =
        await assemblyai.transcripts.transcribe({
          audio: req.file.buffer,
          speech_models: ["universal-3-pro", "universal-2"],
          language_detection: true,
        });

      if (transcript.status === "error") {
        console.error(
          "❌ AssemblyAI error:",
          transcript.error
        );

        return res.status(500).json({
          error: "Transcription failed",
        });
      }

      const text = transcript.text?.trim() || "";

      console.log(
        "📝 AssemblyAI transcript:",
        text
      );

      return res.json({
        text,
        provider: "assemblyai",
      });
    } catch (error) {
      console.error(
        "❌ AssemblyAI transcription error:",
        error
      );

      return res.status(500).json({
        error: "Failed to transcribe audio",
      });
    }
  }
);

// ---------------------------------------
// TEXT:
// Transcript/text -> structured expense
// ---------------------------------------
function correctVietnameseExpense(expense, text) {
  const normalized = String(text)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const result = { ...expense };

  // --------------------------------------------------
  // CATEGORY / NOTE CORRECTIONS
  // --------------------------------------------------

  if (/\bgrab\b/.test(normalized)) {
    result.category = "Transport";
    result.note = "Grab";
  }

  // --------------------------------------------------
  // LOCATION CORRECTIONS
  // --------------------------------------------------

  if (/san bay\s+tan son nhat/.test(normalized)) {
    result.location = "Sân bay Tân Sơn Nhất";
  }

  // --------------------------------------------------
  // VIETNAMESE VND AMOUNT CORRECTIONS
  // Only override the LLM amount when we can parse
  // a clear Vietnamese VND amount deterministically.
  // --------------------------------------------------

  const hasForeignCurrency =
    /\b(usd|eur|euro|euros|dollar|dollars)\b|[$€]/i.test(text);

  if (!hasForeignCurrency) {
    // Example:
    // 1 triệu 950 nghìn -> 1,950,000
    // 2 triệu 300 nghìn -> 2,300,000
    // 1 triệu 50 nghìn  -> 1,050,000
    const millionAndThousandMatch = normalized.match(
      /\b(\d+(?:[.,]\d+)?)\s*trieu\s+(\d+(?:[.,]\d+)?)\s*(?:ngan|nghin|k)\b/
    );

    // Example:
    // 1.5 triệu -> 1,500,000
    // 1,5 triệu -> 1,500,000
    // 2 triệu   -> 2,000,000
    const millionMatch = normalized.match(
      /\b(\d+(?:[.,]\d+)?)\s*trieu\b/
    );

    // Example:
    // 950 nghìn -> 950,000
    // 350k       -> 350,000
    const thousandMatch = normalized.match(
      /\b(\d+(?:[.,]\d+)?)\s*(?:ngan|nghin|k)\b/
    );

    if (millionAndThousandMatch) {
      const millions = Number(
        millionAndThousandMatch[1].replace(",", ".")
      );

      const thousands = Number(
        millionAndThousandMatch[2].replace(",", ".")
      );

      result.amount =
        millions * 1000000 +
        thousands * 1000;

      result.currency = "VND";
    } else if (millionMatch) {
      const millions = Number(
        millionMatch[1].replace(",", ".")
      );

      result.amount = millions * 1000000;
      result.currency = "VND";
    } else if (thousandMatch) {
      const thousands = Number(
        thousandMatch[1].replace(",", ".")
      );

      result.amount = thousands * 1000;
      result.currency = "VND";
    }
  }

  return result;
}

app.post(
  "/parse-expense",
  async (req, res) => {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: "Text is required",
      });
    }

    const prompt = `
You are a strict expense information extraction system.

Extract structured expense data from the user's input.

Allowed categories:
Food, Transport, Shopping, Bills, Other.

Rules:
- Detect the currency explicitly mentioned by the user.
- Supported currencies: VND, EUR, USD.
- "k" or "nghìn" without another currency means thousand VND. Example: 85k = 85000 VND.
- "triệu" without another currency means million VND.
- Vietnamese compound amounts must include ALL magnitude components.
- Example: "1 triệu" = 1000000 VND.
- Example: "1 triệu 950 nghìn" = 1950000 VND.
- Example: "2 triệu 300 nghìn" = 2300000 VND.
- Example: "1 triệu 50 nghìn" = 1050000 VND.
- Never discard the "triệu" component when "triệu" and "nghìn" appear in the same amount.
- "đồng", "VND", or "Vietnam dong" means VND.
- "euro", "euros", or "€" means EUR.
- "dollar", "dollars", "USD", or "$" means USD.
- amount must contain only the numeric amount in the ORIGINAL currency.
- NEVER convert currencies.
- If no currency is mentioned, default to VND.
- Grab, taxi, bus, train -> Transport.
- category must be one of the allowed English categories.
- note must preserve the user's ORIGINAL LANGUAGE.
- NEVER translate the note.
- note should describe what the expense was for.
- Remove the amount and location phrase from note.
- Always capitalize the first letter of the note.
- Correct capitalization of clearly identifiable proper names in the note.
- Vietnamese personal names must use normal name capitalization when identifiable.
- Example: "mua sách giáo khoa cho bé bảo" -> "Mua sách giáo khoa cho bé Bảo".
- location must contain only the location explicitly mentioned by the user.
- If no location is mentioned, location must be "".
- NEVER invent a location.
- For transport expenses, a clearly stated destination or origin is a location.
- Words after "to", "from", "đến", "tới", "ở", or "tại" may indicate a location when they name a place.
- Remove the extracted origin/destination from note.
- Example: "Uber to airport 5 dollars" -> note: "Uber", location: "Airport".
- Example: "Grab đến sân bay 120k" -> note: "Grab", location: "Sân bay".
- Always capitalize the first letter of the location.
- Correct capitalization of identifiable proper names, business names, place names, and administrative areas.
- Example: "nhà sách nhân văn quận 6" -> "Nhà sách Nhân Văn Quận 6".
- Example: "landmark 81" -> "Landmark 81".
- Example: "ho chi minh city" -> "Ho Chi Minh City".
- Return JSON only.

Example 1:
Input: "Ăn trưa 85k ở landmark 81"

Output:
{
  "amount": 85000,
  "currency": "VND",
  "category": "Food",
  "note": "Ăn trưa",
  "location": "Landmark 81"
}

Example 2:
Input: "Grab đi sân bay 120k"

Output:
{
  "amount": 120000,
  "currency": "VND",
  "category": "Transport",
  "note": "Grab",
  "location": "Sân bay"
}

Example 3:
Input: "Coffee 65k at Highlands"

Output:
{
  "amount": 65000,
  "currency": "VND",
  "category": "Food",
  "note": "Coffee",
  "location": "Highlands"
}

Example 4:
Input: "mua sách giáo khoa cho bé bảo 200k ở nhà sách nhân văn quận 6"

Output:
{
  "amount": 200000,
  "currency": "VND",
  "category": "Shopping",
  "note": "Mua sách giáo khoa cho bé Bảo",
  "location": "Nhà sách Nhân Văn Quận 6"
}
  
  Example 5:
  Input: "Tôi mua bánh croissant 3 euro ở Charles de Gaulle Airport"

Output:
{
  "amount": 3,
  "currency": "EUR",
  "category": "Food",
  "note": "Tôi mua bánh croissant",
  "location": "Charles de Gaulle Airport"
}

Return exactly these fields:
{
  "amount": number,
  "currency": string,
  "category": string,
  "note": string,
  "location": string
}

User input:
"${text}"
`;

    try {
      const groqResponse =
        await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${groqApiKey}`,
            },
            body: JSON.stringify({
              model:
                "openai/gpt-oss-20b",
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
              response_format: {
                type: "json_object",
              },
            }),
          }
        );

      const data =
        await groqResponse.json();

      if (!groqResponse.ok) {
        console.error(
          "Groq error:",
          data
        );

        return res.status(500).json({
          error: "LLM request failed",
        });
      }

      const rawExpense = JSON.parse(data.choices[0].message.content);

      console.log("🤖 RAW GROQ EXPENSE:", rawExpense);

      const expense = correctVietnameseExpense(rawExpense, text);

      console.log("🛠️ AFTER VI CORRECTION:", expense);

      // Always capitalize first letter of note
      if (expense.note) {
        expense.note =
          expense.note
            .charAt(0)
            .toLocaleUpperCase("vi-VN") +
          expense.note.slice(1);
      }

      // Always capitalize first letter of location
      if (expense.location) {
        expense.location =
          expense.location
            .charAt(0)
            .toLocaleUpperCase("vi-VN") +
          expense.location.slice(1);
      }

      console.log("💰 Parsed expense:", expense);


res.json(expense);
    } catch (error) {
      console.error(error);

      res.status(500).json({
        error:
          "Failed to parse expense",
      });
    }
  }
);
app.post("/spending-insight", async (req, res) => {
  const { evidence, goal } = req.body;

  if (!evidence) {
    return res.status(400).json({
      error: "Spending evidence is required",
    });
  }

  console.log("🧠 Money Insight evidence:", evidence);
  console.log("🎯 Savings goal:", goal || "No goal");

  const prompt = `
You are the Money Insight engine inside a personal expense app.

Your job is NOT to repeat the spending summary.
Your job is to find the single most useful pattern, change, concentration, or anomaly in the user's REAL spending data.

When a savings goal is provided, add useful goal context without giving financial advice.

Selected view:
${evidence.period}

Use ONLY this spending evidence:
${JSON.stringify(evidence)}

Savings goal:
${goal ? JSON.stringify(goal) : "No savings goal provided"}

HOW TO ANALYZE EACH VIEW

1. If period = "today":
- Compare Today with Yesterday.
- Also compare Today with the average of the OTHER 5 calendar days.
- The other 5 days explicitly exclude Today and Yesterday.
- Focus on meaningful changes in amount, category mix, concentration, or an unusual expense.

2. If period = "yesterday":
- Compare Yesterday with Today.
- Also compare Yesterday with the average of the OTHER 5 calendar days.
- Explain what made Yesterday different.

3. If period = "7days":
- Use last7Days.dailyBreakdown.
- Look for spikes, quiet days, category concentration, unusual expenses, and changes across the seven calendar days.
- Prefer a useful weekly pattern over simply listing totals.

4. If period = "all":
- Compare the recent 7-day pattern with earlierHistory when earlier history exists.
- Look for a meaningful change in spending behavior or category mix.
- If earlier history is insufficient, do not invent a trend.

GOAL CONTEXT RULES

- If no goal is provided, return an empty goalContext.
- If a goal is provided, use its name, targetAmount, savedAmount, currency, targetDate and progressPercent exactly as supplied.
- Only connect spending to the goal when the spending uses the SAME currency as the goal.
- Never convert currencies.
- Never combine VND, USD and EUR.
- Never imply that money spent would otherwise have been saved.
- Never claim an expense delayed, harmed, prevented or reduced progress toward the goal unless the supplied data directly proves it.
- Never tell the user to stop buying something or cut a category.
- Never tell the user how much they should save.

You MAY provide neutral goal context such as:
- same-currency spending as a percentage of the amount already saved;
- same-currency spending as a percentage of the target amount;
- which same-currency categories make up spending in the selected period;
- whether same-currency spending is higher or lower than comparable recent days.

Use at most ONE useful calculation or comparison in goalContext.

If the goal currency has no spending in the selected period, simply say there is no same-currency spending to connect to the goal for this period.

STRICT MONEY RULES

- Never invent a transaction, amount, category, date, average, percentage, goal value, or trend.
- Never convert currencies.
- Never add VND, USD, and EUR together.
- Compare amounts only within the SAME currency.
- A zero-spend calendar day is valid data.
- Do not claim one currency is more spending than another currency.
- Do not call something unusual unless the evidence provides a meaningful comparison.
- If data is too limited for a strong conclusion, say so briefly.

TONE AND INSIGHT QUALITY

- Speak directly to the person using "you" and "your".
- Never refer to them as "the user".
- Use calm, natural language.
- Avoid sensational words such as:
  "huge",
  "dramatic",
  "alarming",
  "shocking",
  "massive",
  "dangerous".
- Do NOT merely repeat the category totals.
- Explain why a pattern is worth noticing.
- Keep the insight concise.
- Do not give financial advice.
- Do not shame or praise spending behavior.

Return JSON ONLY in exactly this structure:

{
  "title": "short, calm insight headline",
  "insight": "1-2 concise sentences explaining the most useful spending pattern",
  "worthNoticing": "one concise sentence explaining why this pattern matters, or an empty string",
  "goalContext": "one concise neutral sentence connecting same-currency spending to the savings goal, or an empty string"
}

Do not include markdown.
Do not include evidence tables.
Do not include bullets.
Do not include any fields other than:
title,
insight,
worthNoticing,
goalContext.
`;

  console.log(
    "🚀 Sending Goal-aware Money Insight request to Groq..."
  );

  try {
    const groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b",
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
          response_format: {
            type: "json_object",
          },
        }),
      }
    );

    const data = await groqResponse.json();

    console.log(
      "📥 Groq Money Insight status:",
      groqResponse.status
    );

    if (!groqResponse.ok) {
      console.error(
        "Money Insight Groq error:",
        data
      );

      return res.status(500).json({
        error: "Failed to generate spending insight",
      });
    }

    const rawContent =
      data?.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error(
        "Groq returned an empty Money Insight response"
      );
    }

    const parsedInsight =
      JSON.parse(rawContent);

    const insight = {
      title:
        typeof parsedInsight.title === "string"
          ? parsedInsight.title.trim()
          : "Spending pattern",

      insight:
        typeof parsedInsight.insight === "string"
          ? parsedInsight.insight.trim()
          : "",

      worthNoticing:
        typeof parsedInsight.worthNoticing === "string"
          ? parsedInsight.worthNoticing.trim()
          : "",

      goalContext:
        typeof parsedInsight.goalContext === "string"
          ? parsedInsight.goalContext.trim()
          : "",
    };

    console.log(
      "✨ Goal-aware Money Insight:",
      insight
    );

    res.json(insight);
  } catch (error) {
    console.error(
      "Money Insight error:",
      error
    );

    res.status(500).json({
      error: "Failed to generate spending insight",
    });
  }
});

// ---------------------------------------
// RECEIPT:
// Image -> Gemini -> structured expense
// ---------------------------------------

function isGeminiServiceUnavailable(error) {
  const status =
    error?.status ||
    error?.statusCode ||
    error?.response?.status ||
    error?.errorDetails?.status;

  const message = String(
    error?.message || ""
  ).toLowerCase();

  return (
    status === 503 ||
    message.includes("503") ||
    message.includes("service unavailable") ||
    message.includes("overloaded")
  );
}

async function generateReceiptWithOneRetry(
  model,
  prompt,
  imagePart
) {
  try {
    return await model.generateContent([
      prompt,
      imagePart,
    ]);
  } catch (error) {
    if (!isGeminiServiceUnavailable(error)) {
      throw error;
    }

    console.warn(
      "⚠️ Gemini unavailable. Retrying receipt scan once..."
    );

    await new Promise((resolve) =>
      setTimeout(resolve, 1200)
    );

    return await model.generateContent([
      prompt,
      imagePart,
    ]);
  }
}

app.post(
  "/scan-receipt",
  upload.single("receipt"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: "Receipt image is required",
        });
      }

      if (!geminiApiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY not found",
        });
      }

      console.log("📷 Receipt received");

      console.log(
  "📦 Receipt size:",
  Math.round(req.file.size / 1024),
  "KB"
);

      const genAI =
        new GoogleGenerativeAI(geminiApiKey);

      const model = genAI.getGenerativeModel({
        model: "gemini-3.6-flash",
      });

      const prompt = `
Read this receipt image and extract the expense.

Return JSON only with exactly these fields:

{
  "amount": number,
  "currency": "VND" | "EUR" | "USD",
  "category": "Food" | "Transport" | "Shopping" | "Bills" | "Other",
  "note": string,
  "location": string,
  "date": string
}

Rules:
- amount MUST be the FINAL GRAND TOTAL actually payable shown on the receipt or invoice.
- Always prioritize explicit final-total labels such as "Tổng cộng tiền thanh toán", "Tổng thanh toán", "Thành tiền", "Grand Total", "Total Due", or "Amount Due".
- If an explicit final grand total is visible, use that number directly.
- NEVER calculate amount by adding individual line items when an explicit final grand total is visible.
- NEVER use subtotal, tax, discount, unit price, or an individual line-item total as amount when a final grand total is available.
- Never convert currencies.
- Detect the original receipt currency.

- Determine the primary language used on the receipt.
- note must contain EXACTLY ONE generic spending-purpose label for the ENTIRE receipt.
- note must be a short noun or noun phrase, preferably 1 to 3 words.
- note must NOT summarize or list individual items.
- NEVER join multiple items using commas, "and", "&", "/", or similar separators.
- Consider ALL items, including discounted, free, or promotional items, only to determine their single shared overall spending purpose.
- Generate note in the SAME LANGUAGE as the receipt.
- For Vietnamese receipts, use natural Vietnamese with correct diacritics when identifiable.
- NEVER translate the note into another language.
- Do NOT include the merchant/store name in note.

Valid examples:
- Vietnamese coffee shop receipt with coffee and tea -> "Đồ uống"
- English hotel invoice with room, minibar and laundry -> "Hotel stay"
- Vietnamese restaurant receipt with several dishes and drinks -> "Ăn uống"
- English supermarket receipt with many products -> "Groceries"

INVALID examples:
- "Hotel stay, minibar drinks, and laundry"
- "Room and minibar"
- "Coffee, tea"
- "Trà xanh và cà phê"

- location should contain the merchant/store name if visible.
- date must be YYYY-MM-DD if visible.
- If date is not visible, return "".
- Do not invent missing information.
- Return JSON only.
`;

      const imagePart = {
        inlineData: {
          data: req.file.buffer.toString("base64"),
          mimeType:
            req.file.mimetype || "image/jpeg",
        },
      };

      console.time("Gemini receipt");

let result;

try {
  result = await generateReceiptWithOneRetry(
    model,
    prompt,
    imagePart
  );
} catch (error) {
  console.error(
    "❌ Gemini generateContent failed:",
    error
  );
  throw error;
}

console.timeEnd("Gemini receipt");

      const text =
        result.response.text().trim();

      console.log("🧾 Gemini receipt:", text);

      const cleanedText = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      const expense = JSON.parse(cleanedText);

      res.json(expense);
    } catch (error) {
      console.error(
        "Receipt scan error:",
        error
      );

      console.dir(error.errorDetails, { depth: null });

      res.status(500).json({
        error: "Failed to scan receipt",
      });
    }
  }
);

// ---------------------------------------
// Gemini API health check
// ---------------------------------------
app.get("/gemini-health", async (req, res) => {
  try {
    const geminiApiKey = process.env.GEMINI_API_KEY;

    if (!geminiApiKey) {
      return res.status(500).json({
        ok: false,
        error: "GEMINI_API_KEY is missing",
      });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1&key=${encodeURIComponent(
        geminiApiKey
      )}`
    );

    if (!response.ok) {
      const errorBody = await response.text();

      console.error(
        "❌ Gemini health check failed:",
        response.status,
        errorBody
      );

      return res.status(response.status).json({
        ok: false,
        status: response.status,
      });
    }

    console.log("✅ Gemini API key verified");

    return res.json({
      ok: true,
      status: response.status,
    });
  } catch (error) {
    console.error(
      "❌ Gemini health check error:",
      error
    );

    return res.status(500).json({
      ok: false,
      error: "Gemini health check failed",
    });
  }
});

app.get("/assemblyai-token", async (req, res) => {
  try {
    const response = await fetch(
      "https://streaming.assemblyai.com/v3/token?expires_in_seconds=60",
      {
        headers: {
          Authorization: assemblyaiApiKey,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("AssemblyAI token error:", data);

      return res.status(response.status).json({
        error: "Could not create AssemblyAI streaming token",
      });
    }

    res.json(data);
  } catch (error) {
    console.error("AssemblyAI token error:", error);

    res.status(500).json({
      error: "Could not create AssemblyAI streaming token",
    });
  }
});

// ---------------------------------------
// Start server
// ---------------------------------------
app.listen(PORT, () => {
  console.log(
    `✅ Server running on http://localhost:${PORT}`
  );
});