import { z } from 'zod';
import { containsInappropriateWords } from '../../lib/inappropriate-words';

export type LessonPlanInput = { topic: string; ageGroup: 'under 10' | '10-16' | '16+' };
export type LessonPlanOutput = { lessonPlan: string };

export async function generateLessonPlan(input: LessonPlanInput): Promise<LessonPlanOutput> {
  // Try Gemini AI if on server
  if (typeof window === 'undefined') {
    try {
      const { getAI } = await import('../genkit');
      const ai = getAI();
      if (ai) {
        const { text } = await ai.generate({
          prompt: `Create a detailed lesson plan for "${input.topic}" for age group ${input.ageGroup}. Include objectives, activities, and assessment.`
        });
        return { lessonPlan: text };
      }
    } catch {}
  }
  // Client-side fallback
  return {
    lessonPlan: `# Lesson Plan: ${input.topic}\n\n**Age Group:** ${input.ageGroup}\n\n## Objectives\n- Understand the key concepts of ${input.topic}\n- Apply knowledge through practical exercises\n- Demonstrate understanding through assessment\n\n## Activities\n1. **Introduction** (10 min) — Overview of ${input.topic}\n2. **Core Content** (20 min) — Deep dive into main concepts\n3. **Practice** (15 min) — Hands-on exercises\n4. **Q&A** (5 min) — Questions and review\n\n## Assessment\n- Quiz on key concepts\n- Practical demonstration\n- Peer discussion`
  };
}
