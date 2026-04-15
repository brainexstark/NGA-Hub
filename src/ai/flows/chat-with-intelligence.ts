
/**
 * @fileOverview A confidential chat flow for the STARK-B Intelligence Core.
 * Recalibrated for PURE client-side execution within the static matrix.
 */

import { z } from 'zod';
import { aiDatabase, simulateDelay } from '../../lib/ai-database';

const ChatInputSchema = z.object({
  message: z.string().describe('The message from the user.'),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

const ChatOutputSchema = z.object({
  text: z.string().describe('The high-performance response from the intelligence core.'),
});
export type ChatOutput = z.infer<typeof ChatOutputSchema>;

/**
 * High-Performance Client Mock
 * Operates strictly on the client node to maintain SPA compatibility.
 */
export async function chatWithIntelligence(input: ChatInput): Promise<ChatOutput> {
  console.log("STARK-B: Intelligence Node Processing Client-Side Request.");
  await simulateDelay(800);
  const randomResponse = aiDatabase.intelligenceResponses[Math.floor(Math.random() * aiDatabase.intelligenceResponses.length)];
  return { text: randomResponse };
}
