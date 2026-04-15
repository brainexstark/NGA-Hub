
/**
 * @fileOverview Defines a function for generating lesson plans.
 * Recalibrated for client-side static synchronization.
 */

import { z } from 'zod';
import { aiDatabase, simulateDelay } from '../../lib/ai-database';

const LessonPlanInputSchema = z.object({
  topic: z.string().describe('The topic for the lesson plan.'),
  ageGroup: z
    .enum(['under 10', '10-16', '16+'])
    .describe('The age group for whom the lesson plan is intended.'),
});
export type LessonPlanInput = z.infer<typeof LessonPlanInputSchema>;

const LessonPlanOutputSchema = z.object({
  lessonPlan: z.string().describe('The generated lesson plan.'),
});
export type LessonPlanOutput = z.infer<typeof LessonPlanOutputSchema>;

/**
 * High-Performance Instructor Mock
 */
export async function generateLessonPlan(input: LessonPlanInput): Promise<LessonPlanOutput> {
  console.log("STARK-B: Instructor Accessing Lesson Archives.");
  await simulateDelay(1200);
  return { lessonPlan: aiDatabase.lessonPlan.plan };
}
