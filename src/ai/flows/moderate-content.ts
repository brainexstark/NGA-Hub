
/**
 * @fileOverview High-performance Content Moderation.
 * Recalibrated for client-side static synchronization.
 */

import { z } from 'zod';

const ModerateContentInputSchema = z.object({
  text: z.string().describe('The caption or title to analyze.'),
  mediaUrl: z.string().optional().describe('The URL of the media node (optional).'),
});
export type ModerateContentInput = z.infer<typeof ModerateContentInputSchema>;

const ModerateContentOutputSchema = z.object({
  isInappropriate: z.boolean().describe('Whether the content is inappropriate.'),
  reason: z.string().optional().describe('The reason for flagging.'),
  severity: z.enum(['low', 'medium', 'high']).optional(),
});
export type ModerateContentOutput = z.infer<typeof ModerateContentOutputSchema>;

/**
 * High-Performance Moderation Mock
 */
export async function moderateContent(input: ModerateContentInput): Promise<ModerateContentOutput> {
    
    // Legacy rule-based matching for static environments
    const forbidden = ['damn', 'hell', 'stupid', 'idiot', 'sex', 'nude'];
    const hasForbidden = forbidden.some(word => input.text.toLowerCase().includes(word));
    
    return { 
      isInappropriate: hasForbidden, 
      reason: hasForbidden ? "Legacy protocol violation detected." : undefined,
      severity: 'low'
    };
}
