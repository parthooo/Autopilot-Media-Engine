const { GoogleGenerativeAI } = require("@google/generative-ai");

const DEFAULT_MODEL = "gemini-flash-latest";

const MODEL_FALLBACKS = [
  "gemini-flash-latest",
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
];

/**
 * @param {string} modelName
 * @returns {import('@google/generative-ai').GenerativeModel | null}
 */
function getModel(modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.3,
    },
  });
}

/**
 * @param {string} prompt
 * @returns {Promise<object | null>}
 */
async function generateJson(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const models = [
    process.env.GEMINI_MODEL,
    ...MODEL_FALLBACKS,
  ].filter(Boolean);
  const uniqueModels = [...new Set(models)];

  let lastError;

  for (const modelName of uniqueModels) {
    try {
      const model = getModel(modelName);
      if (!model) return null;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      lastError = error;
      const retryable =
        error.status === 503 ||
        error.status === 429 ||
        error.message?.includes("high demand");

      if (retryable) {
        console.warn(`Gemini model ${modelName} unavailable, trying next…`);
        continue;
      }
      throw error;
    }
  }

  if (lastError) throw lastError;
  return null;
}

module.exports = { getModel, generateJson, DEFAULT_MODEL, MODEL_FALLBACKS };
