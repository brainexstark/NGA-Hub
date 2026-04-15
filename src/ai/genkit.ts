// Genkit AI - only initialized when GEMINI_API_KEY is available
let ai: any = null;

export function getAI() {
  if (ai) return ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — AI features disabled.');
    return null;
  }
  try {
    const { genkit } = require('genkit');
    const { googleAI } = require('@genkit-ai/google-genai');
    ai = genkit({ plugins: [googleAI()] });
    return ai;
  } catch (e) {
    console.warn('Genkit init failed:', e);
    return null;
  }
}

export { ai };
