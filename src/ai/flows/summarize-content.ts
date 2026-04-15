
/**
 * @fileOverview Summarizes video content.
 * Recalibrated for client-side static synchronization.
 */

import { z } from 'zod';
import { aiDatabase, simulateDelay } from '../../lib/ai-database';

const SummarizeContentInputSchema = z.object({
  videoTitle: z.string().describe('The title of the video.'),
  videoDescription: z.string().describe('The description of the video.'),
  videoTranscript: z.string().describe('The transcript of the video content.'),
});
export type SummarizeContentInput = z.infer<typeof SummarizeContentInputSchema>;

const SummarizeContentOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the video content.'),
});
export type SummarizeContentOutput = z.infer<typeof SummarizeContentOutputSchema>;

/**
 * High-Performance Summarizer Mock
 */
export async function summarizeContent(input: SummarizeContentInput): Promise<SummarizeContentOutput> {
    console.log("STARK-B: Intelligence Summarizing Content Node.");
    await simulateDelay(600);
    return { summary: aiDatabase.contentSummary };
}
