// Genkit AI - server-side only, never imported client-side
// Use dynamic require to prevent webpack from bundling Node.js deps

export function getAI() {
  if (typeof window !== 'undefined') return null; // never run client-side
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { genkit } = require('genkit');
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { googleAI } = require('@genkit-ai/google-genai');
    return genkit({ plugins: [googleAI()] });
  } catch {
    return null;
  }
}
