import { z } from 'zod';

export async function chatWithIntelligence(input: { message: string }): Promise<{ text: string }> {
  if (typeof window === 'undefined') {
    try {
      const { getAI } = await import('../genkit');
      const ai = getAI();
      if (ai) {
        const { text } = await ai.generate({ prompt: `You are a helpful AI assistant for NGA Hub. Answer helpfully.\n\nUser: ${input.message}` });
        return { text };
      }
    } catch {}
  }
  return { text: "I'm here to help! Ask me anything about learning, creativity, or the community." };
}
