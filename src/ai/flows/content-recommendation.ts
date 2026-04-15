
/**
 * @fileOverview A content discovery flow recalibrated for PURE client-side static synchronization.
 */

import { z } from 'zod';
import { aiDatabase, simulateDelay } from '../../lib/ai-database';

const ContentDiscoveryItemSchema = z.object({
  title: z.string(),
  description: z.string(),
  url: z.string(),
  source: z.string(),
  timestamp: z.string(),
});

const ContentRecommendationInputSchema = z.object({
  age: z.number().describe('The age of the user.'),
});
export type ContentRecommendationInput = z.infer<typeof ContentRecommendationInputSchema>;

const ContentRecommendationOutputSchema = z.object({
  recommendations: z.array(ContentDiscoveryItemSchema).describe('A list of AI-discovered web feeds.'),
});
export type ContentRecommendationOutput = z.infer<typeof ContentRecommendationOutputSchema>;

/**
 * High-Performance Aggregator Mock
 * Neutralized SSR logic for SPA deployment.
 */
export async function recommendContent(input: ContentRecommendationInput): Promise<ContentRecommendationOutput> {
  console.log("STARK-B: Aggregator Synchronizing Client-Side Feeds.");
  await simulateDelay(500);
  
  let ageGroup: 'under-10' | '10-16' | '16-plus' = '10-16';
  if (input.age < 10) ageGroup = 'under-10';
  else if (input.age > 16) ageGroup = '16-plus';

  const fallback = aiDatabase.webFeeds[ageGroup as keyof typeof aiDatabase.webFeeds] || aiDatabase.webFeeds.default;
  return { recommendations: fallback };
}
